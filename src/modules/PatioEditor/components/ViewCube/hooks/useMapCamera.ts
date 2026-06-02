import type { CameraTarget } from '../types';
import { useCallback } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { EDITOR_MAP_ID } from '../../../constants';
import { CAMERA_EASE_MS } from '../constants';

/**
 * Bridges the ViewCube widget to the maplibre camera writers.
 *
 * Resolves the `<Map>` (registered under {@link EDITOR_MAP_ID}) and exposes
 * writers for snapping (`easeTo`, animated) and dragging (`jumpTo`, instant) —
 * none of which subscribe to map movement, so the ViewCube shell does not
 * re-render per frame. The live `{ bearing, pitch, zoom }` is read by the leaf
 * components via {@link useCameraState}, isolating the per-frame churn there.
 */
export const useMapCamera = () => {
    const maps = useMap();
    const map = maps[EDITOR_MAP_ID] ?? null;

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

    return { map, easeTo, jumpTo, fitBounds };
};
