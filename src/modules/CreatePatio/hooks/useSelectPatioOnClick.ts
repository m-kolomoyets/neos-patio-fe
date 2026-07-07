import type { SquareRect } from '../types';
import { useEffect } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID, PATIO_SIZE_M, PLACEMENT_MIN_ZOOM } from '../constants';
import { metersToPixels } from '../utils/metersToPixels';
import { isPointInSquare } from '../utils/squareGeometry';
import { useCreatePatioMode } from '../context/CreatePatioContext';
import { usePatioGeometries } from './usePatioGeometries';

/**
 * Subscribes to the map `click` event and hit-tests the click against every
 * existing patio square (rotated by `worldAzimuth − bearing`, read live from the
 * camera so no stale-closure re-attach is needed). A hit selects that patio and,
 * because clicking a neighbour should never fight with placing, always drops the
 * screen back to `view` mode. Clicks outside every square are ignored. Selection
 * is state only — no detail popup this pass.
 */
export const useSelectPatioOnClick = (): void => {
    const maps = useMap();
    const { setMode, setSelectedPatioId } = useCreatePatioMode();
    // Same relocated fixture set the squares render, so a geo hit-test selects a
    // real patio id (the DOM singleton path uses the same ids).
    const patios = usePatioGeometries();

    useEffect(() => {
        const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];
        const map = mapRef?.getMap();
        if (!map) return;

        const handleClick = (event: mapboxgl.MapMouseEvent) => {
            const bearing = map.getBearing();
            const zoom = map.getZoom();

            // Placement-band affordance only. Below the threshold the map is
            // browse-only and the DOM markers own patio taps (singleton select),
            // so this geo hit-test stays out to avoid a second selection path.
            if (zoom < PLACEMENT_MIN_ZOOM) return;

            const hit = patios.find((patio) => {
                const point = map.project([patio.longitude, patio.latitude]);
                const rect: SquareRect = {
                    center: { x: point.x, y: point.y },
                    size: metersToPixels(PATIO_SIZE_M, patio.latitude, zoom),
                    azimuthDeg: patio.azimuthDeg - bearing,
                };

                return isPointInSquare({ x: event.point.x, y: event.point.y }, rect);
            });

            if (!hit) return;

            setSelectedPatioId(hit.id);
            setMode('view');
        };

        map.on('click', handleClick);

        return () => {
            map.off('click', handleClick);
        };
    }, [maps, patios, setMode, setSelectedPatioId]);
};
