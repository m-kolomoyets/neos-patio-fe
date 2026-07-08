import { useCallback, useLayoutEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID, PATIO_SIZE_M } from '../../../constants';
import { metersToPixels } from '../../../utils/metersToPixels';
import { getGridLinesPath } from '../utils/getGridLinesPath';

/** Registers the grid `<path>`; a `null` element unregisters it. */
export type RegisterGrid = (_el: SVGPathElement | null) => void;

/**
 * Writes the reference grid's `d` on every map `render` frame. The grid is a lattice of
 * 100×100 m cells sharing the center square's on-screen size — pitch is the same
 * `metersToPixels(PATIO_SIZE_M, …)` the square uses, so it tracks zoom/latitude — and it
 * is aligned to the square's top-left edge, so the cell over the viewport center is the
 * center square itself. Like `useSquaresDriver`, geometry is mutated imperatively (never
 * through React state) so panning/zooming never re-renders the overlay; only the radial
 * fade mask, which depends on viewport size alone, stays React-driven.
 */
export const useGridDriver = (): RegisterGrid => {
    const maps = useMap();
    const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];
    const elRef = useRef<SVGPathElement | null>(null);
    const applyRef = useRef<(() => void) | null>(null);

    const register = useCallback<RegisterGrid>((el) => {
        elRef.current = el;
    }, []);

    useLayoutEffect(() => {
        const map = mapRef?.getMap();
        if (!map) return;

        const container = map.getContainer();
        const size = { width: container.clientWidth, height: container.clientHeight };

        const apply = () => {
            const el = elRef.current;
            if (!el) return;

            const pitch = metersToPixels(PATIO_SIZE_M, map.getCenter().lat, map.getZoom());
            // Center-square edges: same viewport-centered, screen-upright footprint the
            // square is drawn at, so the center cell lands exactly on it.
            const anchorX = size.width / 2 - pitch / 2;
            const anchorY = size.height / 2 - pitch / 2;

            el.setAttribute('d', getGridLinesPath(size, pitch, anchorX, anchorY));
        };

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            size.width = entry.contentRect.width;
            size.height = entry.contentRect.height;
            apply();
        });
        observer.observe(container);

        applyRef.current = apply;
        apply();
        map.on('render', apply);

        return () => {
            observer.disconnect();
            map.off('render', apply);
            applyRef.current = null;
        };
    }, [mapRef]);

    // Paint once on mount (and when the element first registers) even while the map is
    // idle, so the grid never flashes empty for a frame.
    useLayoutEffect(() => {
        applyRef.current?.();
    });

    return register;
};
