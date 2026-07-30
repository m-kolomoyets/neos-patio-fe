import type { PatioBounds } from '@/services/patios/types';
import { useEffect } from 'react';
import { useCesiumMapReady, useCesiumViewer } from '@/contexts/CesiumViewerContext';
import { Matrix4, ScreenSpaceEventHandler, ScreenSpaceEventType, Transforms } from 'cesium';
import { useOrbitTarget } from './useOrbitTarget';

/**
 * Lock the NATIVE Cesium camera controller to orbit one point — the patio centre
 * — for the read-only Patio View map.
 *
 * Cesium's screen-space controller changes behaviour when `camera.transform` is
 * not the identity (the same mechanism entity tracking uses): `spin3D` routes to
 * `rotate3D`, so a left-drag orbits about the frame's origin at constant
 * distance, and `zoom3D` loses its cursor pick and dollies along the view vector
 * — which points at that origin — clamped by the controller's
 * `minimumZoomDistance`/`maximumZoomDistance` (measured from the origin in this
 * mode). So the whole center-locked feel comes from stock Cesium input handling:
 * no custom `lookAt` per event, nothing to stutter against the controller.
 *
 * The frame is the ENU basis at the bounds centre sampled to ground height (the
 * shared {@link useOrbitTarget} pivot the ViewCube and idle orbit use).
 * `lookAtTransform(frame)` with no offset re-expresses the current pose in that
 * frame without moving the camera, so applying it is invisible.
 *
 * It is (re)applied at the start of every canvas gesture rather than once,
 * because the other camera drivers legitimately clear it: the ViewCube's flights
 * and the idle orbit both end on `lookAtTransform(Matrix4.IDENTITY)` to release
 * the frame. Re-locking on gesture start — after `cancelFlight()` — keeps those
 * flights on their world-space path (a live tween with a foreign transform flies
 * a wrong arc) while the user's very next drag is centre-locked again.
 */
export const useCenteredOrbit = (bounds: PatioBounds, height = 0) => {
    const viewer = useCesiumViewer();
    const ready = useCesiumMapReady();
    const targetRef = useOrbitTarget(viewer, bounds, height);

    useEffect(
        function installCenteredOrbit() {
            // Gate on `ready` so a drag can't lock onto the pre-framed default view.
            if (!viewer || !ready) {
                return undefined;
            }

            const { camera, scene } = viewer;
            const handler = new ScreenSpaceEventHandler(scene.canvas);

            const lockToCenter = () => {
                const center = targetRef.current;
                if (!center || viewer.isDestroyed()) {
                    return;
                }
                // A running tween would fight the gesture and lerps in whatever frame
                // it started in — end it before swapping the camera's frame.
                camera.cancelFlight();
                camera.lookAtTransform(Transforms.eastNorthUpToFixedFrame(center));
            };

            handler.setInputAction(lockToCenter, ScreenSpaceEventType.LEFT_DOWN);
            handler.setInputAction(lockToCenter, ScreenSpaceEventType.WHEEL);
            handler.setInputAction(lockToCenter, ScreenSpaceEventType.PINCH_START);

            return function teardownCenteredOrbit() {
                handler.destroy();
                // Release the frame so a later flight/teardown starts world-relative.
                if (!viewer.isDestroyed()) {
                    camera.lookAtTransform(Matrix4.IDENTITY);
                }
            };
        },
        [viewer, ready, targetRef]
    );
};
