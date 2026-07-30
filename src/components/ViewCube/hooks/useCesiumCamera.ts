import type { Viewer } from 'cesium';
import type { MapInteraction } from '@/components/CesiumMap/utils/sceneBootstrap';
import type { PatioBounds } from '@/services/patios/types';
import type { CameraState, CameraTarget } from '../types';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useCesiumViewer } from '@/contexts/CesiumViewerContext';
import {
    BoundingSphere,
    Cartesian2,
    Cartesian3,
    Math as CesiumMath,
    Ellipsoid,
    HeadingPitchRange,
    Matrix4,
} from 'cesium';
import { useOrbitTarget } from '@/hooks/useOrbitTarget';
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
export const useCesiumCamera = (bounds: PatioBounds, height = 0, interaction: MapInteraction = 'edit') => {
    const viewer = useCesiumViewer();
    // Bounds centre at surface height — the lookAt pivot for every camera move.
    const targetRef = useOrbitTarget(viewer, bounds, height);
    // View mode locks every ViewCube move to the fixed bounds centre so it can
    // never nudge the patio off-axis (agrees with the center-locked map drags);
    // edit mode keeps pivoting on what the camera currently looks at.
    const centerLocked = interaction === 'view';

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

    /**
     * Clamp a range (m) to the screen-space camera controller's zoom limits —
     * the same `minimumZoomDistance`/`maximumZoomDistance` set for the patio
     * view mode in {@link applyInteractionMode}. Those limits only gate
     * mouse-wheel zoom by default; without this, the ViewCube's +/− stepper and
     * presets could fly the camera past them. A no-op in `'edit'` mode, where
     * the controller keeps Cesium's default (unbounded) limits.
     */
    const clampRange = useCallback(
        (range: number) => {
            const controller = viewer?.scene.screenSpaceCameraController;
            if (!controller) return range;
            return CesiumMath.clamp(range, controller.minimumZoomDistance, controller.maximumZoomDistance);
        },
        [viewer]
    );

    /** Fill a partial target from the live camera, clamping pitch and zoom range. */
    const resolve = useCallback(
        (target: CameraTarget): Required<CameraTarget> => {
            const current = readOrientation();
            return {
                bearing: normalizeBearing(target.bearing ?? current.bearing),
                pitch: clampPitch(target.pitch ?? current.pitch),
                range: clampRange(target.range ?? current.range),
            };
        },
        [readOrientation, clampRange]
    );

    // Handle of the in-flight orbit tween (see `orbitTo`), so a new step cancels
    // the previous one instead of stacking rAF loops.
    const orbitRaf = useRef<number | null>(null);
    useEffect(function cancelOrbitOnUnmount() {
        return () => {
            if (orbitRaf.current !== null) cancelAnimationFrame(orbitRaf.current);
        };
    }, []);

    /**
     * Eased **in-place orbit** to an absolute orientation — interpolates
     * bearing/pitch/range around the fixed target via per-frame `lookAt`, so the
     * camera simply rotates around the patio. Unlike `moveCamera`'s
     * `flyToBoundingSphere` (which arcs the camera up-and-over between poses),
     * this keeps it on the orbit sphere — the smooth quarter-turn the flattened
     * step arrows want. Bearing takes the shortest signed path so a +270° step
     * rotates -90° instead of the long way round.
     */
    const orbitTo = useCallback(
        (target: CameraTarget) => {
            const orbitTarget = targetRef.current;
            if (!viewer || !orbitTarget) return;
            const { camera, scene } = viewer;
            const from = readOrientation();
            const to = resolve(target);
            const bearingDelta = ((to.bearing - from.bearing + 540) % 360) - 180;
            const pitchDelta = to.pitch - from.pitch;
            const rangeDelta = to.range - from.range;

            if (orbitRaf.current !== null) cancelAnimationFrame(orbitRaf.current);
            camera.cancelFlight();

            const ease = (t: number) => {
                return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
            };
            let start: number | null = null;
            const tick = (ts: number) => {
                if (viewer.isDestroyed()) return;
                if (start === null) start = ts;
                const t = Math.min((ts - start) / CAMERA_EASE_MS, 1);
                const k = ease(t);
                const offset = new HeadingPitchRange(
                    bearingToHeading(from.bearing + bearingDelta * k),
                    displayPitchToCesium(from.pitch + pitchDelta * k),
                    from.range + rangeDelta * k
                );
                camera.lookAt(orbitTarget, offset);
                camera.lookAtTransform(Matrix4.IDENTITY);
                scene.requestRender();
                orbitRaf.current = t < 1 ? requestAnimationFrame(tick) : null;
            };
            orbitRaf.current = requestAnimationFrame(tick);
        },
        [viewer, targetRef, readOrientation, resolve]
    );

    /** Animated camera move (home, rotate presets). */
    const easeTo = useCallback(
        (target: CameraTarget) => {
            moveCamera(resolve(target), true);
        },
        [moveCamera, resolve]
    );

    /**
     * Animated dolly (zoom in/out stepper + % presets) that changes **only the
     * range**, preserving the live heading/pitch and pivoting on the ground point
     * under the viewport centre — not the fixed bounds centre. So zooming keeps
     * whatever the user is currently looking at, instead of snapping the frame
     * back to the patio's initial coordinate (that's what "Zoom to fit" is for).
     */
    const zoomTo = useCallback(
        (range: number) => {
            if (!viewer) return;
            const { camera, scene } = viewer;
            let pivot: Cartesian3 | undefined;
            if (centerLocked) {
                pivot = targetRef.current ?? undefined;
            } else {
                const center = new Cartesian2(scene.canvas.clientWidth / 2, scene.canvas.clientHeight / 2);
                pivot = scene.pickPositionSupported ? scene.pickPosition(center) : undefined;
                pivot = pivot ?? camera.pickEllipsoid(center, Ellipsoid.WGS84) ?? targetRef.current ?? undefined;
            }
            if (!pivot) return;
            const offset = new HeadingPitchRange(camera.heading, camera.pitch, clampRange(range));
            camera.flyToBoundingSphere(new BoundingSphere(pivot, 0), { offset, duration: CAMERA_EASE_S });
            pumpRenderDuringFlight(viewer, CAMERA_EASE_MS);
        },
        [viewer, targetRef, clampRange, centerLocked]
    );

    /**
     * Animated snap to a cube face/corner that also guarantees the patio fills
     * the viewport — no out-of-bounds ground/sea creeping into frame.
     *
     * The orbit target is the patio bounds centre, so framing the patio is a
     * matter of range: the footprint radius is half the patio diagonal
     * ({@link referenceRange}), and `radius / tan(fovy / 2)` is the range at
     * which that footprint spans the full viewport height (where the
     * out-of-bounds foreground would otherwise sit). The live range is clamped
     * **down** to that fit — only pulling in when the current zoom would reveal
     * out-of-bounds, never pushing out — so an already-tight zoom is preserved.
     */
    const snapTo = useCallback(
        (target: CameraTarget) => {
            const resolved = resolve(target);
            const frustum = viewer?.camera.frustum;
            const fovy = frustum && 'fovy' in frustum ? frustum.fovy : undefined;
            if (typeof fovy === 'number' && Number.isFinite(fovy) && referenceRange > 0) {
                const fitRange = referenceRange / 2 / Math.tan(fovy / 2);
                resolved.range = Math.min(resolved.range, fitRange);
            }
            moveCamera(resolved, true);
        },
        [viewer, resolve, moveCamera, referenceRange]
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

        let pivot: Cartesian3 | undefined;
        if (centerLocked) {
            pivot = targetRef.current ?? undefined;
        } else {
            const center = new Cartesian2(scene.canvas.clientWidth / 2, scene.canvas.clientHeight / 2);
            pivot = scene.pickPositionSupported ? scene.pickPosition(center) : undefined;
            pivot = pivot ?? camera.pickEllipsoid(center, Ellipsoid.WGS84) ?? targetRef.current ?? undefined;
        }
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
    }, [viewer, targetRef, centerLocked]);

    /**
     * Animated zoom-to-fit: frame the whole patio at the default orientation.
     *
     * Orbits the same bounds-centre target (sampled to ground height) as every
     * other cube move, so the camera stays focused on the patio's initial
     * coordinate — unlike a `flyTo(Rectangle)`, which frames the globe rectangle
     * at ellipsoid height and drifts off the sampled ground target. Range is the
     * footprint-fill distance (`radius / tan(fovy / 2)`, radius = half the patio
     * diagonal), matching {@link snapTo}'s framing.
     */
    const fitBounds = useCallback(() => {
        const frustum = viewer?.camera.frustum;
        const fovy = frustum && 'fovy' in frustum ? frustum.fovy : undefined;
        const range =
            typeof fovy === 'number' && Number.isFinite(fovy) && referenceRange > 0
                ? referenceRange / 2 / Math.tan(fovy / 2)
                : referenceRange || FALLBACK_RANGE;
        easeTo({ bearing: DEFAULT_BEARING, pitch: DEFAULT_PITCH, range });
    }, [viewer, referenceRange, easeTo]);

    return { viewer, referenceRange, readOrientation, easeTo, zoomTo, snapTo, orbitTo, beginDragOrbit, fitBounds };
};
