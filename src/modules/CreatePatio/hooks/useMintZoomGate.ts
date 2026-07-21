import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import {
    CREATE_PATIO_MAP_ID,
    PATIO_SIZE_M,
    PLACEMENT_MIN_ZOOM,
    ZOOM_ENOUGH_RATIO,
    ZOOM_IN_TARGET_RATIO,
} from '../constants';
import { prefersReducedMotion } from '../utils/prefersReducedMotion';
import { isZoomEnough, minViewportDimension, zoomForFootprint } from '../utils/zoomForFootprint';

type MintZoomGate = {
    /** `true` once the footprint is both big enough on screen and actually drawn. */
    isZoomedEnough: boolean;
    /** Flies to a zoom that always satisfies the gate. No-op before the map reports. */
    flyToMintableZoom: () => void;
};

/**
 * The zoom gate behind the new-patio popup's footer — where the deleted
 * `ModeZoomButton` logic now lives.
 *
 * The ratio gate alone is not enough: it can read "enough" while the camera is
 * still below `CROSSFADE_BAND.min`, i.e. before the grid and center square are
 * drawn, which would offer a mint for a footprint the user cannot see. Hence the
 * extra `zoom >= PLACEMENT_MIN_ZOOM` term.
 *
 * Stored as a boolean so `setState` bails on an unchanged value: the footer
 * re-renders only when the gate is actually crossed, never per frame. Viewport
 * size comes from a cached `ResizeObserver` value so the per-frame handler never
 * forces a layout on the container Mapbox is mutating.
 */
export const useMintZoomGate = (): MintZoomGate => {
    const maps = useMap();
    const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];
    const [isZoomedEnough, setIsZoomedEnough] = useState(false);
    const sizeRef = useRef({ width: 0, height: 0 });

    useEffect(
        function subscribeToRender() {
            const map = mapRef?.getMap();
            if (!map) return;

            const container = map.getContainer();
            sizeRef.current = { width: container.clientWidth, height: container.clientHeight };

            const sync = () => {
                const zoom = map.getZoom();
                const minDimension = minViewportDimension(sizeRef.current.width, sizeRef.current.height);

                setIsZoomedEnough(
                    isZoomEnough(PATIO_SIZE_M, map.getCenter().lat, zoom, minDimension, ZOOM_ENOUGH_RATIO) &&
                        zoom >= PLACEMENT_MIN_ZOOM
                );
            };

            const observer = new ResizeObserver((entries) => {
                const entry = entries[0];
                if (!entry) return;
                sizeRef.current = { width: entry.contentRect.width, height: entry.contentRect.height };
                sync();
            });
            observer.observe(container);

            sync();
            map.on('render', sync);

            return () => {
                observer.disconnect();
                map.off('render', sync);
            };
        },
        [mapRef]
    );

    const flyToMintableZoom = () => {
        const map = mapRef?.getMap();
        if (!map) return;

        const minDimension = minViewportDimension(sizeRef.current.width, sizeRef.current.height);
        // Both terms of the gate must be satisfied by the single press, so the
        // ratio target is floored at the placement threshold — one press always
        // lands where the grid and center square are drawn, with no boundary flicker.
        const targetZoom = Math.max(
            zoomForFootprint(PATIO_SIZE_M, map.getCenter().lat, ZOOM_IN_TARGET_RATIO * minDimension),
            PLACEMENT_MIN_ZOOM
        );

        // Center is preserved (omitted): the user is aiming at something.
        if (prefersReducedMotion()) {
            map.jumpTo({ zoom: targetZoom });
            return;
        }
        map.flyTo({ zoom: targetZoom });
    };

    return { isZoomedEnough, flyToMintableZoom };
};
