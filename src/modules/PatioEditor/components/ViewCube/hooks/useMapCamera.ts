import type { CameraState, CameraTarget } from '../types';
import { useCallback, useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { EDITOR_MAP_ID } from '../../../constants';
import { CAMERA_EASE_MS } from '../constants';

const INITIAL_CAMERA: CameraState = { bearing: 0, pitch: 0, zoom: 0 };

/**
 * Bridges the ViewCube widget to the maplibre camera.
 *
 * Reads `{ bearing, pitch, zoom }` live from the `<Map>` (registered under
 * {@link EDITOR_MAP_ID}) by subscribing to its `move` event — which also fires
 * on rotate/pitch/zoom — and exposes writers for snapping (`easeTo`, animated)
 * and dragging (`jumpTo`, instant). Camera state lives here as ephemeral local
 * state and never touches the EditorContext reducer / undo history.
 */
export const useMapCamera = () => {
    const maps = useMap();
    const map = maps[EDITOR_MAP_ID] ?? null;
    const [camera, setCamera] = useState<CameraState>(INITIAL_CAMERA);

    useEffect(() => {
        if (!map) return undefined;

        const sync = () => {
            setCamera({ bearing: map.getBearing(), pitch: map.getPitch(), zoom: map.getZoom() });
        };

        sync();
        map.on('move', sync);

        return () => {
            map.off('move', sync);
        };
    }, [map]);

    /** Animated camera move (snap, arrows, home, zoom presets). */
    const easeTo = useCallback(
        (target: CameraTarget) => {
            map?.easeTo({ ...target, duration: CAMERA_EASE_MS });
        },
        [map]
    );

    /** Instant camera move (live drag-to-orbit). */
    const jumpTo = useCallback(
        (target: CameraTarget) => {
            map?.jumpTo(target);
        },
        [map]
    );

    /** Animated fit of a [west, south, east, north] bounds box (zoom-to-fit). */
    const fitBounds = useCallback(
        (bounds: [west: number, south: number, east: number, north: number]) => {
            const [west, south, east, north] = bounds;
            map?.fitBounds(
                [
                    [west, south],
                    [east, north],
                ],
                { duration: CAMERA_EASE_MS }
            );
        },
        [map]
    );

    return { map, camera, easeTo, jumpTo, fitBounds };
};
