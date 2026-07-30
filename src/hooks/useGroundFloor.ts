import type { PatioBounds } from '@/services/patios/types';
import { useEffect } from 'react';
import { useCesiumMapReady, useCesiumViewer } from '@/contexts/CesiumViewerContext';
import { Cartesian3, Cartographic } from 'cesium';
import { clearanceForDistance, sampleGroundHeight } from '@/lib/utils/groundFloor';

/** A valid, above-floor camera pose (world frame) to fall back to on a violation. */
type GoodPose = {
    position: Cartesian3;
    direction: Cartesian3;
    up: Cartesian3;
};

/** Camera positions closer than this (m) count as "didn't move" for floor checks. */
const POSE_EPSILON_M = 1e-3;

/**
 * While the camera has ample headroom over the floor, the ground is re-sampled at
 * most this often (ms) instead of every rendered frame. `scene.sampleHeight` runs
 * an offscreen depth pick — per rendered frame it is real GPU/CPU drag (the idle
 * orbit renders every frame, forever), and this far from the surface a stale
 * floor cannot be crossed within one interval.
 */
const FAR_SAMPLE_INTERVAL_MS = 100;

/**
 * "Ample headroom" = more than this many clearances between the camera and the
 * last sampled floor. Inside that band every rendered frame samples again,
 * restoring the hard per-frame wall exactly where it matters.
 */
const FAR_GAP_CLEARANCE_FACTOR = 2;

/**
 * Keep the free (edit-mode) camera above the ground. The native Cesium
 * screen-space controller has no built-in floor here — collision detection only
 * works against the ellipsoid globe, which this scene hides (`globe.show =
 * false`); the world is the P3DT tileset alone. So `Ctrl`+drag tilt can walk the
 * camera under the mesh, letting the user see the place from below.
 *
 * There is no pre-input hook to veto a native move: the controller applies input
 * in `initializeFrame`, before any `Scene` event. So this blocks by **reverting**
 * — it caches the last above-floor pose each frame and, on `preRender` (the last
 * event before the frame is drawn, only on rendered frames), restores it whenever
 * the controller's new pose dropped below `surface + clearance`. The bad pose is
 * never rasterised, so it reads as a hard wall, not a snap-back.
 *
 * The depth pick behind the check is throttled: a stationary camera skips it
 * outright, and one with ample floor headroom re-samples on an interval instead
 * of per frame ({@link FAR_SAMPLE_INTERVAL_MS}) — only near the floor does every
 * rendered frame pay for a sample, keeping the wall hard where it matters.
 *
 * Both modes run the native controller now, so both need this floor; `enabled`
 * stays as the opt-out for any future mode that clamps its own camera.
 */
export const useGroundFloor = (bounds: PatioBounds, enabled: boolean) => {
    const viewer = useCesiumViewer();
    const ready = useCesiumMapReady();

    const [west, south, east, north] = bounds;
    const centerLng = (west + east) / 2;
    const centerLat = (south + north) / 2;

    useEffect(
        function installGroundFloor() {
            if (!viewer || !ready || !enabled) {
                return undefined;
            }

            const { camera, scene } = viewer;
            const centerCarto = Cartographic.fromDegrees(centerLng, centerLat);

            // Reference anchor for the distance-scaled clearance: the patio centre
            // at its surface height, resolved lazily once its tile has streamed.
            let centerGround: Cartesian3 | null = null;
            let good: GoodPose | null = null;
            // Floor from the last real sample + when it was taken — drives the
            // far-band throttle so a high camera doesn't pay a depth pick per frame.
            let lastFloor: number | null = null;
            let lastSampleAt = 0;

            const capture = () => {
                if (!good) {
                    good = {
                        position: new Cartesian3(),
                        direction: new Cartesian3(),
                        up: new Cartesian3(),
                    };
                }
                Cartesian3.clone(camera.positionWC, good.position);
                Cartesian3.clone(camera.directionWC, good.direction);
                Cartesian3.clone(camera.upWC, good.up);
            };

            const enforce = () => {
                if (viewer.isDestroyed()) {
                    return;
                }

                // Pose unchanged since the last verdict (only scene content
                // re-rendered, e.g. tile streaming): nothing new to judge. Refresh
                // the cached orientation — rotation alone can't cross the floor —
                // and skip the depth pick entirely.
                if (good && Cartesian3.equalsEpsilon(camera.positionWC, good.position, 0, POSE_EPSILON_M)) {
                    capture();
                    return;
                }

                const cameraHeight = camera.positionCartographic.height;
                const referenceDistance = centerGround
                    ? Cartesian3.distance(camera.positionWC, centerGround)
                    : cameraHeight;

                // Far band: with clearances of headroom over the last sampled
                // floor, the surface can't rise enough to matter within one
                // throttle interval — trust the pose and skip the pick. Worst case
                // (flying fast over unseen taller ground) the wall engages one
                // interval late instead of never rasterising the bad pose.
                const now = performance.now();
                if (
                    lastFloor !== null &&
                    now - lastSampleAt < FAR_SAMPLE_INTERVAL_MS &&
                    cameraHeight - lastFloor > clearanceForDistance(referenceDistance) * FAR_GAP_CLEARANCE_FACTOR
                ) {
                    capture();
                    return;
                }
                lastSampleAt = now;

                const surface = sampleGroundHeight(scene, camera.positionCartographic);
                // No sample = can't judge (unsupported / tiles not streamed): trust
                // the current pose and keep it as the fallback.
                if (surface === undefined) {
                    capture();
                    return;
                }

                if (!centerGround) {
                    const centerHeight = sampleGroundHeight(scene, centerCarto);
                    if (centerHeight !== undefined) {
                        centerGround = Cartesian3.fromRadians(
                            centerCarto.longitude,
                            centerCarto.latitude,
                            centerHeight
                        );
                    }
                }
                const refDist = centerGround ? Cartesian3.distance(camera.positionWC, centerGround) : cameraHeight;
                const floor = surface + clearanceForDistance(refDist);
                lastFloor = floor;

                if (cameraHeight >= floor) {
                    capture();
                    return;
                }
                // Below the floor: revert to the last good pose before this frame
                // rasterises. Nothing to revert to on the very first frames — let it
                // pass; the next above-floor frame seeds the fallback.
                if (!good) {
                    return;
                }
                camera.setView({
                    destination: good.position,
                    orientation: { direction: good.direction, up: good.up },
                });
                scene.requestRender();
            };

            const remove = scene.preRender.addEventListener(enforce);

            return function teardownGroundFloor() {
                remove();
            };
        },
        [viewer, ready, enabled, centerLng, centerLat]
    );
};
