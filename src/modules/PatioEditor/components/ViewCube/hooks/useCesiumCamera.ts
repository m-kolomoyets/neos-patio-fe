import type { Viewer } from 'cesium';
import type { PatioBounds } from '@/services/patios/types';
import type { CameraState, CameraTarget } from '../types';
import { useCallback, useMemo } from 'react';
import {
    BoundingSphere,
    Cartesian2,
    Cartesian3,
    Math as CesiumMath,
    Ellipsoid,
    HeadingPitchRange,
    Matrix4,
    Rectangle,
} from 'cesium';
import { CAMERA_EASE_MS, CAMERA_EASE_S, DEFAULT_BEARING, DEFAULT_PITCH } from '../constants';
import {
    bearingToHeading,
    cesiumPitchToDisplay,
    clampPitch,
    displayPitchToCesium,
    headingToBearing,
    normalizeBearing,
    orbitCamera,
} from '../utils/cameraMath';
import { useCesiumViewer } from '../../../context/CesiumViewerContext';
import { useOrbitTarget } from '../../../hooks/useOrbitTarget';

/** Fallback range (m) used before the patio bounds resolve a real reference distance. */
const FALLBACK_RANGE = 250;

/** A live drag-orbit gesture bound to a captured viewport pivot (see `beginDragOrbit`). */
export type DragOrbit = {
    /** Orbit by a pixel delta from the gesture start, scaled by `sensitivity` (deg/px). */
    update: (_dx: number, _dy: number, _sensitivity: number) => void;
};

/**
 * Pump `scene.requestRender()` once per animation frame for `durationMs` so a
 * Cesium camera flight actually advances under `requestRenderMode` (where the
 * scene otherwise renders only on explicit request). Self-cancels on viewer
 * teardown.
 */
const pumpRenderDuringFlight = (viewer: Viewer, durationMs: number) => {
    let elapsed = 0;
    let last: number | null = null;
    const tick = (ts: number) => {
        if (viewer.isDestroyed()) return;
        if (last !== null) elapsed += ts - last;
        last = ts;
        viewer.scene.requestRender();
        if (elapsed < durationMs) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

/**
 * Bridges the ViewCube widget to the Cesium camera, modelling every move as
 * `lookAt(target, HeadingPitchRange)` around the patio bounds centre sampled to
 * ground height.
 *
 * Exposes the live-orientation reader the cube/zoom leaves and gesture hooks
 * read (`readOrientation`, in display units), the per-patio reference range
 * (patio diagonal → 100% on the zoom readout), and three writers: `easeTo`
 * (animated snap/home/presets), `jumpTo` (instant drag-orbit), and `fitBounds`
 * (zoom-to-fit). None subscribe to camera movement, so the ViewCube shell never
 * re-renders per frame — the leaves own that via {@link useCameraState}. Every
 * writer ends in a render request, satisfying `requestRenderMode`.
 */
export const useCesiumCamera = (bounds: PatioBounds) => {
    const viewer = useCesiumViewer();
    // Bounds centre at surface height — the lookAt pivot for every camera move.
    const targetRef = useOrbitTarget(viewer, bounds);

    const [west, south, east, north] = bounds;

    /** 100% on the zoom readout = the patio diagonal — i.e. "the whole patio framed". */
    const referenceRange = useMemo(() => {
        return Cartesian3.distance(Cartesian3.fromDegrees(west, south), Cartesian3.fromDegrees(east, north));
    }, [west, south, east, north]);

    /** Read the live camera as display `{ bearing, pitch, range }`. */
    const readOrientation = useCallback((): CameraState => {
        if (!viewer) return { bearing: DEFAULT_BEARING, pitch: DEFAULT_PITCH, range: referenceRange || FALLBACK_RANGE };
        const { camera } = viewer;
        const target = targetRef.current;
        return {
            bearing: headingToBearing(camera.heading),
            pitch: cesiumPitchToDisplay(camera.pitch),
            range: target ? Cartesian3.distance(camera.positionWC, target) : referenceRange || FALLBACK_RANGE,
        };
    }, [viewer, referenceRange, targetRef]);

    // Move the camera to an absolute display orientation around the target.
    // Animated moves fly via a bounding sphere offset (+ render pump); instant
    // moves use lookAt then immediately release the reference frame so the
    // default controls stay free.
    const moveCamera = useCallback(
        (target: Required<CameraTarget>, animated: boolean) => {
            const orbitTarget = targetRef.current;
            if (!viewer || !orbitTarget) return;
            const { camera, scene } = viewer;
            const offset = new HeadingPitchRange(
                bearingToHeading(target.bearing),
                displayPitchToCesium(target.pitch),
                target.range
            );

            if (animated) {
                camera.flyToBoundingSphere(new BoundingSphere(orbitTarget, 0), {
                    offset,
                    duration: CAMERA_EASE_S,
                });
                pumpRenderDuringFlight(viewer, CAMERA_EASE_MS);
            } else {
                // Kill any in-flight snap tween so a live drag isn't fought by it.
                camera.cancelFlight();
                camera.lookAt(orbitTarget, offset);
                camera.lookAtTransform(Matrix4.IDENTITY);
                scene.requestRender();
            }
        },
        [viewer, targetRef]
    );

    /** Fill a partial target from the live camera, clamping pitch. */
    const resolve = useCallback(
        (target: CameraTarget): Required<CameraTarget> => {
            const current = readOrientation();
            return {
                bearing: normalizeBearing(target.bearing ?? current.bearing),
                pitch: clampPitch(target.pitch ?? current.pitch),
                range: target.range ?? current.range,
            };
        },
        [readOrientation]
    );

    /** Animated camera move (snap, arrows, home, zoom presets). */
    const easeTo = useCallback(
        (target: CameraTarget) => {
            moveCamera(resolve(target), true);
        },
        [moveCamera, resolve]
    );

    /**
     * Start a live drag-orbit gesture from the **current** viewport, returning an
     * `update(dx, dy)` applier.
     *
     * The pivot is the ground point under the viewport centre — it lies on the
     * camera's centre ray, so `lookAt(pivot, HPR(currentHeading, currentPitch,
     * distanceToPivot))` reconstructs the exact current camera pose. The first
     * `update(0, 0)` is therefore a no-op visually (seamless), and subsequent
     * deltas orbit around what the user is actually looking at — not the fixed
     * bounds centre — so panning before dragging no longer glitches the view.
     */
    const beginDragOrbit = useCallback((): DragOrbit | null => {
        if (!viewer) return null;
        const { camera, scene } = viewer;

        const center = new Cartesian2(scene.canvas.clientWidth / 2, scene.canvas.clientHeight / 2);
        let pivot = scene.pickPositionSupported ? scene.pickPosition(center) : undefined;
        pivot = pivot ?? camera.pickEllipsoid(center, Ellipsoid.WGS84) ?? targetRef.current ?? undefined;
        if (!pivot) return null;

        const frozenPivot = Cartesian3.clone(pivot);
        const start: CameraState = {
            bearing: headingToBearing(camera.heading),
            pitch: cesiumPitchToDisplay(camera.pitch),
            range: Cartesian3.distance(camera.positionWC, frozenPivot),
        };

        return {
            update: (dx, dy, sensitivity) => {
                if (viewer.isDestroyed()) return;
                const next = orbitCamera(start, dx, dy, sensitivity);
                const offset = new HeadingPitchRange(
                    bearingToHeading(next.bearing),
                    displayPitchToCesium(next.pitch),
                    start.range
                );
                camera.cancelFlight();
                camera.lookAt(frozenPivot, offset);
                camera.lookAtTransform(Matrix4.IDENTITY);
                scene.requestRender();
            },
        };
    }, [viewer, targetRef]);

    /** Animated fit of a [west, south, east, north] bounds box (zoom-to-fit). */
    const fitBounds = useCallback(
        (box: PatioBounds) => {
            if (!viewer) return;
            const [w, s, e, n] = box;
            viewer.camera.flyTo({
                destination: Rectangle.fromDegrees(w, s, e, n),
                orientation: {
                    heading: bearingToHeading(DEFAULT_BEARING),
                    pitch: CesiumMath.toRadians(-DEFAULT_PITCH),
                    roll: 0,
                },
                duration: CAMERA_EASE_S,
            });
            pumpRenderDuringFlight(viewer, CAMERA_EASE_MS);
        },
        [viewer]
    );

    return { viewer, referenceRange, readOrientation, easeTo, beginDragOrbit, fitBounds };
};
