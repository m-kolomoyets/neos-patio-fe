import type { Viewer } from 'cesium';
import type { CameraState, CameraTarget, CubeFace, CubeTarget } from '../types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CAMERA_EASE_MS, CUBE_TARGETS, FLATTEN_EXIT_THRESHOLD_DEG } from '../constants';
import { isCubeFace, isSnappedToFace, resolveSnapOrientation, stepFace } from '../utils/cameraMath';

type UseFlattenedFaceArgs = {
    viewer: Viewer | null;
    readOrientation: () => CameraState;
    /** Animated snap that keeps the patio framed (no out-of-bounds in view). */
    snapTo: (_target: CameraTarget) => void;
};

/**
 * Owns the flattened "selected face" state (#04).
 *
 * Clicking a **side face** flattens the cube to that face head-on with helper
 * arrows; clicking a **corner/top** stays the live 3D cube. The state exits on
 * a drag-orbit, or once the camera drifts past {@link FLATTEN_EXIT_THRESHOLD_DEG}
 * from the snapped face. A `snapping` flag (cleared {@link CAMERA_EASE_MS} after
 * a snap fires) suppresses that drift exit while our own flight is still settling
 * through off-target angles.
 *
 * Returns the selected face plus the callbacks the widget wires to the cube
 * interaction (`onSnap`/`onOrbitStart`) and the arrow buttons (`stepBy`/`goTop`).
 */
export const useFlattenedFace = ({ viewer, readOrientation, snapTo }: UseFlattenedFaceArgs) => {
    const [selectedFace, setSelectedFace] = useState<CubeFace | null>(null);
    const snapping = useRef(false);
    const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Mirrors selectedFace for the imperative postRender handler (avoids re-subscribing).
    const faceRef = useRef<CubeFace | null>(null);
    useEffect(() => {
        faceRef.current = selectedFace;
    }, [selectedFace]);

    /** Suppress drift-exit for the length of a programmatic flight, then re-arm it. */
    const beginSnapping = useCallback(() => {
        snapping.current = true;
        if (snapTimer.current !== null) clearTimeout(snapTimer.current);
        snapTimer.current = setTimeout(() => {
            snapping.current = false;
        }, CAMERA_EASE_MS);
    }, []);

    // Watch the live camera: our own snaps fly through off-target angles
    // (suppressed by `snapping` until the flight settles), but once a user orbits
    // away from the snapped face beyond tolerance, exit the flattened state.
    useEffect(() => {
        if (!viewer) return undefined;
        const checkDrift = () => {
            const face = faceRef.current;
            if (!face || snapping.current) return;
            const { bearing, pitch } = readOrientation();
            if (!isSnappedToFace({ bearing, pitch }, face, FLATTEN_EXIT_THRESHOLD_DEG)) {
                setSelectedFace(null);
            }
        };
        return viewer.scene.postRender.addEventListener(checkDrift);
    }, [viewer, readOrientation]);

    useEffect(() => {
        return () => {
            if (snapTimer.current !== null) clearTimeout(snapTimer.current);
        };
    }, []);

    /** Click-snap result: flatten on a side face, stay 3D on a corner/top. */
    const onSnap = useCallback(
        (target: CubeTarget) => {
            beginSnapping();
            setSelectedFace(isCubeFace(target) ? target : null);
        },
        [beginSnapping]
    );

    /** A drag-orbit always exits the flattened state. */
    const onOrbitStart = useCallback(() => {
        setSelectedFace(null);
    }, []);

    /** Left/right arrows: step a quarter-turn to the neighbor side, stay flattened. */
    const stepBy = useCallback(
        (dir: 1 | -1) => {
            setSelectedFace((face) => {
                if (!face) return face;
                const next = stepFace(face, dir);
                beginSnapping();
                snapTo({
                    bearing: CUBE_TARGETS[next].bearing ?? readOrientation().bearing,
                    pitch: CUBE_TARGETS[next].pitch,
                });
                return next;
            });
        },
        [beginSnapping, snapTo, readOrientation]
    );

    /** Up arrow: jump to the top view (exits flattened — top is not a side face). */
    const goTop = useCallback(() => {
        beginSnapping();
        snapTo(resolveSnapOrientation('top', readOrientation().bearing));
        setSelectedFace(null);
    }, [beginSnapping, snapTo, readOrientation]);

    return { selectedFace, onSnap, onOrbitStart, stepBy, goTop };
};
