import type { PatioGeometry } from '../hooks/usePatioGeometries';
import type { Point, SquareRect } from '../types';
import { PATIO_SIZE_M, PLACEMENT_MIN_ZOOM } from '../constants';
import { metersToPixels } from './metersToPixels';
import { isPointInSquare } from './squareGeometry';

/**
 * Hit-tests a screen point against every patio square, projecting each footprint
 * live from the camera (rotated by `worldAzimuth − bearing`), and returns the
 * patio under the point or `undefined`.
 *
 * Below `PLACEMENT_MIN_ZOOM` there are no geo squares — the map is browse-only and
 * the DOM markers own patio taps — so the test short-circuits, keeping selection
 * and hover on exactly the same gate. Pure apart from reading the camera.
 */
export const findPatioAtPoint = (
    map: mapboxgl.Map,
    patios: PatioGeometry[],
    point: Point
): PatioGeometry | undefined => {
    const zoom = map.getZoom();
    if (zoom < PLACEMENT_MIN_ZOOM) return undefined;

    const bearing = map.getBearing();

    return patios.find((patio) => {
        const projected = map.project([patio.longitude, patio.latitude]);
        const rect: SquareRect = {
            center: { x: projected.x, y: projected.y },
            size: metersToPixels(PATIO_SIZE_M, patio.latitude, zoom),
            azimuthDeg: patio.azimuthDeg - bearing,
        };

        return isPointInSquare(point, rect);
    });
};
