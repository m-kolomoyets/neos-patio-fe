import type { PatioGeometry } from './usePatioGeometries';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID, PATIO_SIZE_M } from '../constants';
import { getProjectedNorthDeg } from '../utils/getProjectedNorthDeg';
import { metersToPixels } from '../utils/metersToPixels';
import { getRectAttrs } from '../utils/squareGeometry';

/** Geometry source a registered `<rect>` tracks: the viewport center or a patio. */
export type GeoId = 'center' | `patio:${string}`;

/** Registers a `<rect>` under a stable key; a `null` element unregisters it. */
export type RegisterRect = (_key: string, _geoId: GeoId, _el: SVGRectElement | null) => void;

/** The screen-pixel geo id for a patio square. */
export const patioGeoId = (id: string): GeoId => {
    return `patio:${id}`;
};

/**
 * Writes the projected `<rect>` geometry onto every registered overlay element on
 * the map's `render` event — never through React state. `useMapCamera` used to
 * `setCamera` each frame, forcing React to reconcile the whole SVG tree a frame
 * *behind* Mapbox's GL canvas; the squares swam and flickered against the tiles.
 * Here the same DOM nodes are mutated synchronously in the `render` handler (the
 * pattern `useCrossfadeDriver` already uses for opacity), so the overlay tracks
 * the canvas pixel-for-pixel with zero re-render churn.
 *
 * The structural tree — one node set per patio id — is owned by React and only
 * re-renders when the patio list or visibility changes; positions never are.
 */
export const useSquaresDriver = (patios: PatioGeometry[]): RegisterRect => {
    const maps = useMap();
    // `current` is set only inside the `<Map>` subtree, and it populates a render
    // *after* this child first mounts without changing the provider's identity.
    // Depend on the resolved ref (not `maps`) so the effect re-subscribes once the
    // map registers — otherwise a null first run would never paint.
    const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];
    // key → the element and which geometry source it mirrors. Many keys share one
    // geo id (e.g. the base center rect, its clip, and every intersection copy).
    const targetsRef = useRef(new Map<string, { geoId: GeoId; el: SVGRectElement }>());
    // Read live inside the per-frame handler without re-subscribing on data change;
    // kept in sync from the layout effect below (never written during render).
    const patiosRef = useRef(patios);
    // The current frame writer, exposed so a fresh mount/data change can paint once
    // even while the map is idle (no `render` events firing).
    const applyRef = useRef<(() => void) | null>(null);

    const register = useCallback<RegisterRect>((key, geoId, el) => {
        if (el) {
            targetsRef.current.set(key, { geoId, el });
        } else {
            targetsRef.current.delete(key);
        }
    }, []);

    useLayoutEffect(() => {
        const map = mapRef?.getMap();
        if (!map) return;

        const container = map.getContainer();
        const size = { width: container.clientWidth, height: container.clientHeight };

        const apply = () => {
            const zoom = map.getZoom();

            // Build the pixel attrs for each geometry source once per frame, then
            // fan them out to every element mirroring that source.
            const attrsByGeoId = new Map<GeoId, ReturnType<typeof getRectAttrs>>();
            attrsByGeoId.set(
                'center',
                getRectAttrs({
                    center: { x: size.width / 2, y: size.height / 2 },
                    size: metersToPixels(PATIO_SIZE_M, map.getCenter().lat, zoom),
                    // Screen-upright regardless of bearing.
                    azimuthDeg: 0,
                })
            );
            for (const patio of patiosRef.current) {
                const point = map.project([patio.longitude, patio.latitude]);
                attrsByGeoId.set(
                    patioGeoId(patio.id),
                    getRectAttrs({
                        center: { x: point.x, y: point.y },
                        size: metersToPixels(PATIO_SIZE_M, patio.latitude, zoom),
                        // World-anchored: base azimuth plus the projected screen angle
                        // of north here, so the footprint stays pinned under rotation.
                        azimuthDeg: patio.azimuthDeg + getProjectedNorthDeg(map, patio.longitude, patio.latitude),
                    })
                );
            }

            for (const { geoId, el } of targetsRef.current.values()) {
                const attrs = attrsByGeoId.get(geoId);
                if (!attrs) continue;
                el.setAttribute('x', `${attrs.x}`);
                el.setAttribute('y', `${attrs.y}`);
                el.setAttribute('width', `${attrs.width}`);
                el.setAttribute('height', `${attrs.height}`);
                el.setAttribute('transform', attrs.transform);
            }
        };

        // Viewport size only changes on resize; cache it so the per-frame handler
        // never reads the DOM (a forced layout on the element Mapbox is mutating).
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

    // Newly mounted rects (first show, or patios arriving after mount) must be
    // painted once, before the browser paints, even if the map isn't emitting
    // `render` frames right now — otherwise they flash at the origin for a frame.
    useLayoutEffect(() => {
        patiosRef.current = patios;
        applyRef.current?.();
    }, [patios]);

    return register;
};
