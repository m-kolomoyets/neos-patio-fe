import type { Viewer } from 'cesium';
import type { PatioBounds } from '@/services/patios/types';
import { useEffect, useRef } from 'react';
import { Cartesian3 } from 'cesium';
import { sampleSurfaceHeight } from '../utils/geoPlacement';

/**
 * Resolve and hold the camera orbit target — the patio bounds centre sampled to
 * the real surface height.
 *
 * Returns a ref (not state) so per-frame camera loops (drag-orbit, idle orbit)
 * read it without re-rendering. Seeds the target at ellipsoid height (0)
 * immediately and upgrades it to the sampled surface height once the tileset
 * resolves one. Shared by {@link useCesiumCamera} (lookAt pivot) and
 * {@link useIdleRotation} (ambient orbit centre) so target resolution lives in
 * one place.
 */
export const useOrbitTarget = (viewer: Viewer | null, bounds: PatioBounds) => {
    const targetRef = useRef<Cartesian3 | null>(null);

    const [west, south, east, north] = bounds;
    const centerLng = (west + east) / 2;
    const centerLat = (south + north) / 2;

    useEffect(() => {
        if (!viewer) return undefined;
        targetRef.current = Cartesian3.fromDegrees(centerLng, centerLat, 0);

        let cancelled = false;
        void sampleSurfaceHeight(viewer.scene, centerLng, centerLat).then((height) => {
            if (!cancelled && height !== undefined && !viewer.isDestroyed()) {
                targetRef.current = Cartesian3.fromDegrees(centerLng, centerLat, height);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [viewer, centerLng, centerLat]);

    return targetRef;
};
