import { useLayoutEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID } from '../constants';

/**
 * Binds one text node to the live camera: `format` is run on every map `render`
 * and its result written straight into the element's `textContent`. Same driver
 * pattern as `useSquaresDriver` — panning and rotating repaint the value without
 * re-rendering the popup's component tree once per frame.
 *
 * The formatter is read through a ref so it may close over fresh props without
 * re-subscribing the per-frame handler.
 */
export const useLiveMapText = <T extends HTMLElement>(format: (_map: mapboxgl.Map) => string) => {
    const maps = useMap();
    // `current` is set inside the `<Map>` subtree; the popup is a sibling of the
    // map, so it resolves the same map by id from the `MapProvider` registry.
    const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];
    const elementRef = useRef<T | null>(null);
    const formatRef = useRef(format);
    // The current frame writer, exposed so a formatter change repaints once even
    // while the map is idle (no `render` events firing).
    const applyRef = useRef<(() => void) | null>(null);

    useLayoutEffect(
        function subscribeToRender() {
            const map = mapRef?.getMap();
            if (!map) return;

            const apply = () => {
                const element = elementRef.current;
                if (!element) return;
                element.textContent = formatRef.current(map);
            };

            applyRef.current = apply;
            apply();
            map.on('render', apply);

            return () => {
                map.off('render', apply);
                applyRef.current = null;
            };
        },
        [mapRef]
    );

    useLayoutEffect(
        function syncFormatter() {
            formatRef.current = format;
            applyRef.current?.();
        },
        [format]
    );

    return elementRef;
};
