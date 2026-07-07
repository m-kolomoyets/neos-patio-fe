import type { SquareRect } from '../types';
import { useEffect, useMemo } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID, PATIO_SEED, START_COORDINATE } from '../constants';
import { metersToPixels } from '../utils/metersToPixels';
import { generatePatios } from '../utils/seededPatios';
import { isPointInSquare } from '../utils/squareGeometry';
import { useCreatePatioMode } from '../context/CreatePatioContext';

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
    const patios = useMemo(() => {
        return generatePatios(PATIO_SEED, START_COORDINATE);
    }, []);

    useEffect(() => {
        const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];
        const map = mapRef?.getMap();
        if (!map) return;

        const handleClick = (event: mapboxgl.MapMouseEvent) => {
            const bearing = map.getBearing();
            const zoom = map.getZoom();

            const hitIndex = patios.features.findIndex((feature) => {
                const [longitude, latitude] = feature.geometry.coordinates;
                const point = map.project([longitude, latitude]);
                const rect: SquareRect = {
                    center: { x: point.x, y: point.y },
                    size: metersToPixels(feature.properties.sizeMeters, latitude, zoom),
                    azimuthDeg: feature.properties.azimuthDeg - bearing,
                };

                return isPointInSquare({ x: event.point.x, y: event.point.y }, rect);
            });

            if (hitIndex === -1) return;

            setSelectedPatioId(String(hitIndex));
            setMode('view');
        };

        map.on('click', handleClick);

        return () => {
            map.off('click', handleClick);
        };
    }, [maps, patios, setMode, setSelectedPatioId]);
};
