import { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID } from '../../../constants';
import { getProjectedNorthDeg } from '../../../utils/getProjectedNorthDeg';
import { getMorphStyle } from '../utils/getMorphStyle';

/** One morphing marker element plus the inputs its live size depends on. */
export type MorphTarget = {
    el: HTMLElement;
    longitude: number;
    latitude: number;
    /** Fixed circle diameter this marker settles to below the morph band. */
    circleSize: number;
    /**
     * World azimuth (deg) of the patio footprint. Combined per frame with the
     * projected screen angle of north at the marker so the square end matches the
     * geo square in `SquaresOverlay`. Omitted for the create marker, which stays
     * screen-upright.
     */
    azimuthDeg?: number;
    /**
     * Screen-centered overlay (the create marker): its footprint is sized from the
     * live map-center latitude each frame, not the fixed `latitude` above. Mercator
     * px-per-meter grows with latitude, so a fixed-latitude size would drift ever
     * larger from the center geo square (which uses `map.getCenter().lat`) as the
     * camera pans north. Patios keep their own fixed latitude.
     */
    centered?: boolean;
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
            for (const { el, longitude, latitude, circleSize, azimuthDeg, centered } of targetsRef.current.values()) {
                // Screen-centered overlay tracks the live center latitude so its geo
                // footprint stays matched to the center square as the camera pans north.
                const lat = centered ? map.getCenter().lat : latitude;
                const { size, radius, progress } = getMorphStyle(zoom, lat, circleSize);
                el.style.setProperty('--morph-size', `${size}px`);
                el.style.setProperty('--morph-radius', `${radius}px`);
                el.style.setProperty('--morph-text-opacity', `${progress}`);
                // World-pinned orientation for patios; upright (no azimuth) for create.
                const rotate =
                    azimuthDeg === undefined ? 0 : azimuthDeg + getProjectedNorthDeg(map, longitude, latitude);
                el.style.setProperty('--morph-rotate', `${rotate}deg`);
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
