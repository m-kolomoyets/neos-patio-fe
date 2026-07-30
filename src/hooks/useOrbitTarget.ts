import type { Viewer } from 'cesium';
import type { PatioBounds } from '@/services/patios/types';
import { useEffect, useRef } from 'react';
import { useCesiumGroundHeight } from '@/contexts/CesiumViewerContext';
import { Cartesian3, Cartographic } from 'cesium';
import { sampleGroundHeight } from '@/lib/utils/groundFloor';
import { resolvePivotHeight } from '@/lib/utils/resolvePivotHeight';
import { sampleSurfaceHeight } from '@/lib/utils/sampleSurfaceHeight';

/**
 * Resolve and hold the camera orbit target — the patio bounds centre, raised to
 * the real ground surface plus the patio's authored `height` offset.
 *
 * Returns a ref (not state) so per-frame camera loops (drag-orbit, idle orbit)
 * read it without re-rendering. Shared by {@link useCesiumCamera} (lookAt pivot)
 * and {@link useIdleRotation} (ambient orbit centre) so target resolution lives
 * in one place.
 *
 * Ground arrives in up to three steps, each only ever raising the pivot (see
 * {@link resolvePivotHeight}):
 * 1. The bootstrap-published {@link useCesiumGroundHeight}, when the scene has
 *    already resolved it (the common case on a re-mounted widget).
 * 2. A cheap synchronous depth-buffer sample, retried on `postRender` until the
 *    tiles under the centre have painted.
 * 3. The authoritative async most-detailed sample.
 *
 * Until any of those land the pivot sits at ellipsoid height + the offset, which
 * on elevated terrain is under the mesh — unavoidable, since nothing in the
 * scene can report the surface before it streams. The pivot is never left
 * `null`, so the orbit controls are always live.
 */
export const useOrbitTarget = (viewer: Viewer | null, bounds: PatioBounds, height = 0) => {
    const targetRef = useRef<Cartesian3 | null>(null);
    const publishedGround = useCesiumGroundHeight();

    const [west, south, east, north] = bounds;
    const centerLng = (west + east) / 2;
    const centerLat = (south + north) / 2;

    useEffect(() => {
        if (!viewer || viewer.isDestroyed()) {
            return undefined;
        }

        // Highest ground resolved so far, carried across every refinement below so
        // a coarser sample can never dip the pivot back into the mesh.
        let best: number | undefined;

        const apply = (ground: number | undefined) => {
            const pivot = resolvePivotHeight({ ground, patioHeight: height, best });
            best = pivot.best;
            targetRef.current = Cartesian3.fromDegrees(centerLng, centerLat, pivot.height);
        };

        // Seed immediately so the pivot is never null: bootstrap's ground when it
        // already resolved, else the ellipsoid fallback.
        apply(publishedGround ?? undefined);

        // Bootstrap already resolved the authoritative most-detailed ground —
        // the pivot is final, so skip the probe and the async sample entirely.
        // `sampleHeightMostDetailed` force-loads tiles, and several instances of
        // this hook are live per scene (drag orbit, idle orbit, ViewCube), so
        // re-sampling here multiplies tile streaming during the load window for
        // zero refinement. Also stops the effect re-run triggered by the ground
        // being published (null → value) from firing yet another sample.
        if (best !== undefined) {
            return undefined;
        }

        const { scene } = viewer;
        const centerCarto = Cartographic.fromDegrees(centerLng, centerLat);

        // Cheap sync sample, retried each rendered frame until the tiles under the
        // centre have painted. Removes itself on the first hit, so this costs a
        // handful of frames at most and nothing once resolved.
        let removeSyncProbe: (() => void) | null = null;
        if (best === undefined && scene.sampleHeightSupported) {
            removeSyncProbe = scene.postRender.addEventListener(function probeGround() {
                if (viewer.isDestroyed()) {
                    return;
                }
                const ground = sampleGroundHeight(scene, centerCarto);
                if (ground === undefined) {
                    return;
                }
                apply(ground);
                removeSyncProbe?.();
                removeSyncProbe = null;
            });
        }

        let cancelled = false;
        void sampleSurfaceHeight(scene, centerLng, centerLat).then((ground) => {
            if (cancelled || ground === undefined || viewer.isDestroyed()) {
                return;
            }
            apply(ground);
        });

        return () => {
            cancelled = true;
            removeSyncProbe?.();
        };
    }, [viewer, centerLng, centerLat, height, publishedGround]);

    return targetRef;
};
