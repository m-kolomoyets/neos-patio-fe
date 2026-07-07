import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID } from '../constants';

export type MapCamera = {
    width: number;
    height: number;
    latitude: number;
    zoom: number;
    /** Map bearing (azimuth) in degrees, clockwise from north. Pitch is locked top-down. */
    bearing: number;
};

const readCamera = (map: mapboxgl.Map): MapCamera => {
    const container = map.getContainer();

    return {
        width: container.clientWidth,
        height: container.clientHeight,
        latitude: map.getCenter().lat,
        zoom: map.getZoom(),
        bearing: map.getBearing(),
    };
};

/**
 * Subscribes to the map's `move` and `render` events and returns the current
 * viewport size, center latitude, and zoom. Re-syncing on `render` (not just
 * `move`) keeps overlays tracking smoothly through inertial pans and zooms.
 */
export const useMapCamera = (): MapCamera | null => {
    const maps = useMap();
    // `current` is set only inside the `<Map>` subtree; the header button reads
    // the same map by id from the `MapProvider` registry.
    const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];
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
