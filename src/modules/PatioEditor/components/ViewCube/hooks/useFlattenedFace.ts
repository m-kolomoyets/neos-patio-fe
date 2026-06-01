import type { MapRef } from 'react-map-gl/maplibre';
import type { CameraTarget, CubeFace, CubeTarget } from '../types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CUBE_TARGETS, FLATTEN_EXIT_THRESHOLD_DEG } from '../constants';
import { isCubeFace, isSnappedToFace, resolveSnapOrientation, stepFace } from '../utils/cameraMath';

type UseFlattenedFaceArgs = {
    map: MapRef | null;
    easeTo: (_target: CameraTarget) => void;
};

/**
 * Owns the flattened "selected face" state (#04).
 *
 * Clicking a **side face** flattens the cube to that face head-on with helper
 * arrows; clicking a **corner/top** stays the live 3D cube. The state exits on
 * a drag-orbit, or once the camera drifts past {@link FLATTEN_EXIT_THRESHOLD_DEG}
 * from the snapped face. A `snapping` flag suppresses that drift exit while our
 * own `easeTo` animation is still settling (it passes through off-target angles).
 *
 * Returns the selected face plus the callbacks the widget wires to the cube
 * interaction (`onSnap`/`onOrbitStart`) and the arrow buttons (`stepBy`/`goTop`).
 */
export const useFlattenedFace = ({ map, easeTo }: UseFlattenedFaceArgs) => {
    const [selectedFace, setSelectedFace] = useState<CubeFace | null>(null);
    const snapping = useRef(false);
    // Mirrors selectedFace for the imperative map-event handler (avoids re-subscribing).
    const faceRef = useRef<CubeFace | null>(null);
    useEffect(() => {
        faceRef.current = selectedFace;
    }, [selectedFace]);

    // Watch the live camera: our own snaps animate through off-target angles
    // (suppressed by `snapping` until `moveend`), but once a user orbits the
    // map away from the snapped face beyond tolerance, exit the flattened state.
    useEffect(() => {
        if (!map) return undefined;
        const settle = () => {
            snapping.current = false;
        };
        const checkDrift = () => {
            const face = faceRef.current;
            if (!face || snapping.current) return;
            const camera = { bearing: map.getBearing(), pitch: map.getPitch() };
            if (!isSnappedToFace(camera, face, FLATTEN_EXIT_THRESHOLD_DEG)) {
                setSelectedFace(null);
            }
        };
        map.on('moveend', settle);
        map.on('move', checkDrift);
        return () => {
            map.off('moveend', settle);
            map.off('move', checkDrift);
        };
    }, [map]);

    /** Click-snap result: flatten on a side face, stay 3D on a corner/top. */
    const onSnap = useCallback((target: CubeTarget) => {
        snapping.current = true;
        setSelectedFace(isCubeFace(target) ? target : null);
    }, []);

    /** A drag-orbit always exits the flattened state. */
    const onOrbitStart = useCallback(() => {
        setSelectedFace(null);
    }, []);

    /** Left/right arrows: step a quarter-turn to the neighbor side, stay flattened. */
    const stepBy = useCallback(
        (dir: 1 | -1) => {
            setSelectedFace((face) => {
                if (!face || !map) return face;
                const next = stepFace(face, dir);
                snapping.current = true;
                easeTo({ bearing: CUBE_TARGETS[next].bearing ?? map.getBearing(), pitch: CUBE_TARGETS[next].pitch });
                return next;
            });
        },
        [map, easeTo]
    );

    /** Up arrow: jump to the top view (exits flattened — top is not a side face). */
    const goTop = useCallback(() => {
        if (!map) return;
        snapping.current = true;
        easeTo(resolveSnapOrientation('top', map.getBearing()));
        setSelectedFace(null);
    }, [map, easeTo]);

    return { selectedFace, onSnap, onOrbitStart, stepBy, goTop };
};
