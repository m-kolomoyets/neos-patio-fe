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
                const refDist = centerGround
                    ? Cartesian3.distance(camera.positionWC, centerGround)
                    : camera.positionCartographic.height;
                const floor = surface + clearanceForDistance(refDist);

                if (camera.positionCartographic.height >= floor) {
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
