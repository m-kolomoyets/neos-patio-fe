import { useLayoutEffect, useState } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID } from '../../../constants';

/** Pixel size of the map container. */
export type ViewportSize = { width: number; height: number };

/**
 * Resize-observed pixel size of the map container. Unlike `useSquaresDriver` — which
 * caches the size in a ref and never re-renders — the reference grid is screen-fixed
 * (fixed pitch, intersection pinned to viewport center) and only its React geometry
 * changes, and only when the viewport resizes. A resize is rare, so committing it to
 * state here is cheap and never touches the per-frame `render` path.
 */
export const useViewportSize = (): ViewportSize => {
    const maps = useMap();
    const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];
    const [size, setSize] = useState<ViewportSize>({ width: 0, height: 0 });

    useLayoutEffect(() => {
        const map = mapRef?.getMap();
        if (!map) return;

        const container = map.getContainer();

        // ResizeObserver delivers an initial observation on `observe()`, so the first
        // size lands from the callback — no synchronous seed (which would trigger a
        // cascading render) is needed. Until then `size` is 0×0 and the grid path is
        // empty, so nothing paints for the one frame before the observer fires.
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        });
        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    }, [mapRef]);

    return size;
};
