import { prefersReducedMotion } from './prefersReducedMotion';

/**
 * Flies the camera to a center (and optionally a zoom), degrading to an instant
 * jump under reduced motion. Shared by every selection path — singleton badge
 * taps and the square hit-test — so a patio always arrives on screen the same way.
 * Omitting `zoom` keeps the current one: selecting a square the user is already
 * looking at should recenter, not re-frame.
 */
export const flyToView = (map: mapboxgl.Map, center: [number, number], zoom?: number): void => {
    const options = zoom === undefined ? { center } : { center, zoom };

    if (prefersReducedMotion()) {
        map.jumpTo(options);
        return;
    }

    map.flyTo(options);
};
