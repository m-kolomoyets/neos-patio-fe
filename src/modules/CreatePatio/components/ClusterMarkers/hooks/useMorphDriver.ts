import { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID } from '../../../constants';
import { getMorphStyle } from '../utils/getMorphStyle';

/** One morphing marker element plus the inputs its live size depends on. */
export type MorphTarget = {
    el: HTMLElement;
    latitude: number;
    /** Fixed circle diameter this marker settles to below the morph band. */
    circleSize: number;
};

/** Registers a marker element by key; a `null` target unregisters it. */
export type RegisterMorphTarget = (_key: string, _target: MorphTarget | null) => void;

/**
 * Drives the square↔circle morph on every registered marker element straight
 * from the map's `render` event — writing the `--morph-size` / `--morph-radius`
 * CSS custom properties per frame, never through a React re-render. Individual
 * patio markers and the create-patio marker register their element via the
 * returned callback; count bubbles (clusters) do not morph and stay out.
 */
export const useMorphDriver = (): RegisterMorphTarget => {
    const maps = useMap();
    const targetsRef = useRef(new Map<string, MorphTarget>());

    const register = useCallback<RegisterMorphTarget>((key, target) => {
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
            for (const { el, latitude, circleSize } of targetsRef.current.values()) {
                const { size, radius } = getMorphStyle(zoom, latitude, circleSize);
                el.style.setProperty('--morph-size', `${size}px`);
                el.style.setProperty('--morph-radius', `${radius}%`);
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
