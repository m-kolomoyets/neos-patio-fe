import type { CrossfadeLayer } from '../utils/getCrossfadeOpacity';
import { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID } from '../constants';
import { getCrossfadeOpacity } from '../utils/getCrossfadeOpacity';

/** One cross-fading element plus which handoff layer it belongs to. */
export type CrossfadeTarget = {
    el: HTMLElement | SVGElement;
    layer: CrossfadeLayer;
};

/** Registers an element by key; a `null` target unregisters it. */
export type RegisterCrossfadeTarget = (_key: string, _target: CrossfadeTarget | null) => void;

/**
 * Drives the browse ⇆ placement cross-fade straight from the map's `render` event,
 * writing `--crossfade-opacity` onto every registered element per frame — never a
 * React re-render. Both layers are updated in the same tick from the same zoom, so
 * the morphing browse markers (`ClusterMarkers`) and the geo SVG squares
 * (`SquaresOverlay`) fade against each other in perfect lockstep across
 * `CROSSFADE_BAND`. Shared by both components (promoted here since neither owns it).
 */
export const useCrossfadeDriver = (): RegisterCrossfadeTarget => {
    const maps = useMap();
    const targetsRef = useRef(new Map<string, CrossfadeTarget>());

    const register = useCallback<RegisterCrossfadeTarget>((key, target) => {
        if (target) {
            targetsRef.current.set(key, target);
        } else {
            targetsRef.current.delete(key);
        }
    }, []);

    useEffect(() => {
        // `current` is set inside the `<Map>` subtree; fall back to the registry id.
        const map = (maps.current ?? maps[CREATE_PATIO_MAP_ID])?.getMap();
        if (!map) return;

        const apply = () => {
            const zoom = map.getZoom();
            for (const { el, layer } of targetsRef.current.values()) {
                el.style.setProperty('--crossfade-opacity', `${getCrossfadeOpacity(zoom, layer)}`);
            }
        };

        apply();
        map.on('render', apply);

        return () => {
            map.off('render', apply);
        };
    }, [maps]);

    return register;
};
