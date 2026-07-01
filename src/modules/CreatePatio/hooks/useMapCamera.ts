import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/mapbox';

export type MapCamera = {
    width: number;
    height: number;
    latitude: number;
    zoom: number;
};

const readCamera = (map: mapboxgl.Map): MapCamera => {
    const container = map.getContainer();

    return {
        width: container.clientWidth,
        height: container.clientHeight,
        latitude: map.getCenter().lat,
        zoom: map.getZoom(),
    };
};

/**
 * Subscribes to the map's `move` and `render` events and returns the current
 * viewport size, center latitude, and zoom. Re-syncing on `render` (not just
 * `move`) keeps overlays tracking smoothly through inertial pans and zooms.
 */
export const useMapCamera = (): MapCamera | null => {
    const { current: mapRef } = useMap();
    const [camera, setCamera] = useState<MapCamera | null>(null);

    useEffect(() => {
        const map = mapRef?.getMap();
        if (!map) return;

        const sync = () => {
            return setCamera(readCamera(map));
        };
        sync();

        map.on('move', sync);
        map.on('render', sync);

        return () => {
            map.off('move', sync);
            map.off('render', sync);
        };
    }, [mapRef]);

    return camera;
};
