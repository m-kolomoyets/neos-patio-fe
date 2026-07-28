import type { SquareRect } from '../types';
import { useLayoutEffect, useRef, useState } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID, PATIO_SIZE_M } from '../constants';
import { getProjectedNorthDeg } from '../utils/getProjectedNorthDeg';
import { metersToPixels } from '../utils/metersToPixels';
import { squaresOverlap } from '../utils/squareGeometry';
import { usePatioGeometries } from './usePatioGeometries';

/**
 * Whether the create-mode center square currently overlaps any patio. Recomputed
 * on every map `render` from the same projection the overlay driver uses, so the
 * boolean flips in lockstep with the red collision paint. State only re-renders
 * on a change (the frame handler bails out otherwise), so panning that keeps the
 * overlap status stable never re-renders the popup tree.
 */
export const useOverlapDetected = (): boolean => {
    const maps = useMap();
    const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];
    const patios = usePatioGeometries();
    const patiosRef = useRef(patios);
    const [isOverlapping, setIsOverlapping] = useState(false);

    useLayoutEffect(
        function syncPatios() {
            patiosRef.current = patios;
        },
        [patios]
    );

    useLayoutEffect(
        function subscribeToRender() {
            const map = mapRef?.getMap();
            if (!map) return;

            const container = map.getContainer();
            // Cache the viewport (resize-only) so the per-frame handler never forces
            // a layout on the element Mapbox is mutating — as `useSquaresDriver` does.
            const size = { width: container.clientWidth, height: container.clientHeight };

            const apply = () => {
                const zoom = map.getZoom();
                const mapCenter = map.getCenter();
                const centerRect: SquareRect = {
                    center: { x: size.width / 2, y: size.height / 2 },
                    size: metersToPixels(PATIO_SIZE_M, mapCenter.lat, zoom),
                    azimuthDeg: 0,
                };

                const detected = patiosRef.current.some((patio) => {
                    const point = map.project([patio.longitude, patio.latitude]);
                    const patioRect: SquareRect = {
                        center: { x: point.x, y: point.y },
                        size: metersToPixels(PATIO_SIZE_M, patio.latitude, zoom),
                        azimuthDeg: patio.azimuthDeg + getProjectedNorthDeg(map, patio.longitude, patio.latitude),
                    };

                    return squaresOverlap(centerRect, patioRect);
                });

                setIsOverlapping((previous) => {
                    return previous === detected ? previous : detected;
                });
            };

            const observer = new ResizeObserver((entries) => {
                const entry = entries[0];
                if (!entry) return;
                size.width = entry.contentRect.width;
                size.height = entry.contentRect.height;
                apply();
            });
            observer.observe(container);

            apply();
            map.on('render', apply);

            return () => {
                observer.disconnect();
                map.off('render', apply);
            };
        },
        [mapRef]
    );

    return isOverlapping;
};
