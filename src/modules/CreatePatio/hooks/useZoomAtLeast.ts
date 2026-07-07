import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID } from '../constants';

/**
 * Live boolean gate: `true` once the camera is at/above `threshold`. Driven off
 * the map `zoom`/`render` events but stored as a boolean, so `setState` bails on
 * an unchanged value — a consumer re-renders only when the threshold is actually
 * crossed, never per frame. `false` until the camera first reports.
 */
export const useZoomAtLeast = (threshold: number): boolean => {
    const maps = useMap();
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        // `current` is set inside the `<Map>` subtree; fall back to the registry id.
        const map = (maps.current ?? maps[CREATE_PATIO_MAP_ID])?.getMap();
        if (!map) return;

        const sync = () => {
            setEnabled(map.getZoom() >= threshold);
        };
        sync();

        map.on('zoom', sync);
        map.on('render', sync);

        return () => {
            map.off('zoom', sync);
            map.off('render', sync);
        };
    }, [maps, threshold]);

    return enabled;
};
