import { useEffect, useRef, useState } from 'react';
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

/**
 * Per-frame camera read. Viewport size is passed in from a cached ResizeObserver
 * value (see below) instead of re-read from the DOM each frame — reading
 * `clientWidth`/`clientHeight` inside the `render` handler would force a
 * synchronous layout flush every frame on the container Mapbox is mutating.
 */
const readCamera = (map: mapboxgl.Map, width: number, height: number): MapCamera => {
    return {
        width,
        height,
        latitude: map.getCenter().lat,
        zoom: map.getZoom(),
        bearing: map.getBearing(),
    };
};

/**
 * Subscribes to the map's `render` event and returns the current viewport size,
 * center latitude, zoom, and bearing. Re-syncing on `render` keeps overlays
 * tracking smoothly through inertial pans and zooms; `render` already covers
 * every `move`, so it is the only camera event needed.
 *
 * Viewport width/height only change on resize, so they are tracked with a
 * `ResizeObserver` and cached — the per-frame `render` handler never touches the
 * DOM (no forced layout).
 */
export const useMapCamera = (): MapCamera | null => {
    const maps = useMap();
    // `current` is set only inside the `<Map>` subtree; the header button reads
    // the same map by id from the `MapProvider` registry.
    const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];
    const [camera, setCamera] = useState<MapCamera | null>(null);
    // Latest container size, updated only by the ResizeObserver, read by the
    // per-frame `render` sync without touching the DOM.
    const sizeRef = useRef({ width: 0, height: 0 });

    useEffect(() => {
        const map = mapRef?.getMap();
        if (!map) return;

        const container = map.getContainer();
        // Seed the cached size before the first camera read.
        sizeRef.current = { width: container.clientWidth, height: container.clientHeight };

        const sync = () => {
            const { width, height } = sizeRef.current;
            return setCamera(readCamera(map, width, height));
        };

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const { width, height } = entry.contentRect;
            sizeRef.current = { width, height };
            // Push a fresh camera on resize even if the map isn't rendering.
            sync();
        });
        observer.observe(container);

        sync();
        map.on('render', sync);

        return () => {
            observer.disconnect();
            map.off('render', sync);
        };
    }, [mapRef]);

    return camera;
};
