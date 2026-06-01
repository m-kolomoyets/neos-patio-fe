import type { MapRef } from 'react-map-gl/maplibre';
import type { CameraTarget, CubeTarget } from '../types';
import { useCallback, useRef, useState } from 'react';
import { CLICK_THRESHOLD_PX, CUBE_TARGETS, DRAG_SENSITIVITY } from '../constants';
import { orbitCamera, resolveSnapOrientation } from '../utils/cameraMath';

type UseCubeInteractionArgs = {
    map: MapRef | null;
    easeTo: (_target: CameraTarget) => void;
    jumpTo: (_target: CameraTarget) => void;
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
    /** Orientation captured at press, accumulated against (drift-free). */
    bearing: number;
    pitch: number;
    /** Cube target under the press, snapped to on a click (null = empty space). */
    target: CubeTarget | null;
    /** Flipped once travel passes the click threshold; from then on it's a drag. */
    dragging: boolean;
};

/** Toggle maplibre's own gestures so cube-drag doesn't fight map-drag (mirrors ObjectMesh). */
const setMapInteractions = (map: MapRef, enabled: boolean) => {
    const raw = map.getMap();
    const handlers = [
        raw.dragPan,
        raw.scrollZoom,
        raw.dragRotate,
        raw.touchZoomRotate,
        raw.doubleClickZoom,
        raw.keyboard,
    ];
    handlers.forEach((h) => {
        if (enabled) h.enable();
        else h.disable();
    });
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
 * promotes it to a drag (disabling maplibre's gestures and orbiting instantly);
 * a release with no such movement snaps to the captured target. Handlers spread
 * onto the cube element.
 */
export const useCubeInteraction = ({ map, easeTo, jumpTo, onSnap, onOrbitStart }: UseCubeInteractionArgs) => {
    const gesture = useRef<Gesture | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!map) return;
            const faceEl = (e.target as HTMLElement).closest<HTMLElement>('[data-face]');
            gesture.current = {
                pointerId: e.pointerId,
                startX: e.clientX,
                startY: e.clientY,
                bearing: map.getBearing(),
                pitch: map.getPitch(),
                target: toCubeTarget(faceEl?.dataset.face),
                dragging: false,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
        },
        [map]
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const g = gesture.current;
            if (!map || !g || g.pointerId !== e.pointerId) return;

            const dx = e.clientX - g.startX;
            const dy = e.clientY - g.startY;

            if (!g.dragging) {
                if (Math.hypot(dx, dy) < CLICK_THRESHOLD_PX) return;
                g.dragging = true;
                setIsDragging(true);
                setMapInteractions(map, false);
                onOrbitStart?.();
            }

            jumpTo(orbitCamera({ bearing: g.bearing, pitch: g.pitch }, dx, dy, DRAG_SENSITIVITY));
        },
        [map, jumpTo, onOrbitStart]
    );

    const endGesture = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const g = gesture.current;
            if (!map || !g || g.pointerId !== e.pointerId) return;
            gesture.current = null;

            if (g.dragging) {
                setMapInteractions(map, true);
                setIsDragging(false);
                return;
            }
            // No meaningful travel → treat as a click and snap to the pressed target.
            if (g.target) {
                easeTo(resolveSnapOrientation(g.target, map.getBearing()));
                onSnap?.(g.target);
            }
        },
        [map, easeTo, onSnap]
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
