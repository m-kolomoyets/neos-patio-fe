import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID } from '../constants';

/**
 * Live map bearing in degrees (0 = north-up). Driven off the map `rotate`/`render`
 * events — same event-driven pattern as `useZoomAtLeast` — so the compass needle
 * and the rotate buttons read one consistent orientation. `0` until the camera
 * first reports.
 */
export const useMapBearing = (): number => {
    const maps = useMap();
    const [bearing, setBearing] = useState(0);

    useEffect(() => {
        // `current` is set inside the `<Map>` subtree; fall back to the registry id.
        const map = (maps.current ?? maps[CREATE_PATIO_MAP_ID])?.getMap();
        if (!map) return;

        const sync = () => {
            setBearing(map.getBearing());
        };
        sync();

        map.on('rotate', sync);
        map.on('render', sync);

        return () => {
            map.off('rotate', sync);
            map.off('render', sync);
        };
    }, [maps]);

    return bearing;
};
