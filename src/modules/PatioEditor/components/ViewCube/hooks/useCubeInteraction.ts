import type { Viewer } from 'cesium';
import type { CameraState, CameraTarget, CubeTarget } from '../types';
import type { DragOrbit } from './useCesiumCamera';
import { useCallback, useRef, useState } from 'react';
import { CLICK_THRESHOLD_PX, CUBE_TARGETS, DRAG_SENSITIVITY } from '../constants';
import { resolveSnapOrientation } from '../utils/cameraMath';

type UseCubeInteractionArgs = {
    viewer: Viewer | null;
    /** Reads the live camera orientation in display units (used for click-snap). */
    readOrientation: () => CameraState;
    easeTo: (_target: CameraTarget) => void;
    /** Begins a live drag-orbit from the current viewport (seamless pivot capture). */
    beginDragOrbit: () => DragOrbit | null;
    /** Fired with the clicked target right after its snap `easeTo` (drives flattened mode). */
    onSnap?: (_target: CubeTarget) => void;
    /** Fired once a press promotes to a drag-orbit (exits flattened mode). */
    onOrbitStart?: () => void;
};

/** In-flight gesture state, kept in a ref so pointer handlers stay referentially stable. */
type Gesture = {
    pointerId: number;
    startX: number;
    startY: number;
    /** Cube target under the press, snapped to on a click (null = empty space). */
    target: CubeTarget | null;
    /** The live drag-orbit, lazily created when the press promotes to a drag (null until then). */
    orbit: DragOrbit | null;
    /** Flipped once travel passes the click threshold; from then on it's a drag. */
    dragging: boolean;
};

/** Toggle Cesium's own camera gestures so cube-drag doesn't fight scene-drag. */
const setSceneInteractions = (viewer: Viewer, enabled: boolean) => {
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableRotate = enabled;
    controller.enableTranslate = enabled;
    controller.enableZoom = enabled;
    controller.enableTilt = enabled;
    controller.enableLook = enabled;
};

/** A `data-face` value is a valid {@link CubeTarget} iff it keys the target table. */
const toCubeTarget = (value: string | undefined): CubeTarget | null => {
    return value !== undefined && value in CUBE_TARGETS ? (value as CubeTarget) : null;
};

/**
 * Makes the cube interactive: a click snaps the camera (`easeTo`), a drag orbits
 * it live (`jumpTo`).
 *
 * One unified pointer gesture: on press it captures the orientation + the
 * `data-face` under the pointer; movement past {@link CLICK_THRESHOLD_PX}
 * promotes it to a drag (disabling Cesium's gestures and orbiting instantly);
 * a release with no such movement snaps to the captured target. Handlers spread
 * onto the cube element.
 */
export const useCubeInteraction = ({
    viewer,
    readOrientation,
    easeTo,
    beginDragOrbit,
    onSnap,
    onOrbitStart,
}: UseCubeInteractionArgs) => {
    const gesture = useRef<Gesture | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!viewer) return;
            const faceEl = (e.target as HTMLElement).closest<HTMLElement>('[data-face]');
            gesture.current = {
                pointerId: e.pointerId,
                startX: e.clientX,
                startY: e.clientY,
                target: toCubeTarget(faceEl?.dataset.face),
                orbit: null,
                dragging: false,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
        },
        [viewer]
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const g = gesture.current;
            if (!viewer || !g || g.pointerId !== e.pointerId) return;

            const dx = e.clientX - g.startX;
            const dy = e.clientY - g.startY;

            if (!g.dragging) {
                if (Math.hypot(dx, dy) < CLICK_THRESHOLD_PX) return;
                g.dragging = true;
                // Capture the orbit pivot now, from the current viewport — so the
                // drag continues seamlessly from wherever the camera was panned to.
                g.orbit = beginDragOrbit();
                // Re-anchor the delta origin to this point so the first orbit frame
                // starts at zero (no jump from the click-threshold travel).
                g.startX = e.clientX;
                g.startY = e.clientY;
                setIsDragging(true);
                setSceneInteractions(viewer, false);
                onOrbitStart?.();
                return;
            }

            g.orbit?.update(dx, dy, DRAG_SENSITIVITY);
        },
        [viewer, beginDragOrbit, onOrbitStart]
    );

    const endGesture = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const g = gesture.current;
            if (!viewer || !g || g.pointerId !== e.pointerId) return;
            gesture.current = null;

            if (g.dragging) {
                setSceneInteractions(viewer, true);
                setIsDragging(false);
                return;
            }
            // No meaningful travel → treat as a click and snap to the pressed target.
            if (g.target) {
                easeTo(resolveSnapOrientation(g.target, readOrientation().bearing));
                onSnap?.(g.target);
            }
        },
        [viewer, easeTo, readOrientation, onSnap]
    );

    return {
        isDragging,
        handlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp: endGesture,
            onPointerCancel: endGesture,
        },
    };
};
