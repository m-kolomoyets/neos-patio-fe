import { useEffect } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import {
    CREATE_PATIO_MAP_ID,
    GLOBE_SPIN_DEG_PER_SEC,
    GLOBE_SPIN_IDLE_DELAY_MS,
    GLOBE_SPIN_MAX_ZOOM,
} from '../constants';
import { prefersReducedMotion } from '../utils/prefersReducedMotion';

/**
 * Interactions that count as "the user is driving the camera" and park the spin.
 * `pointermove`/`touchmove` keep re-arming the idle countdown mid-drag, so a long
 * drag never has the spin resume underneath it.
 */
const INTERACTION_EVENTS = [
    'pointerdown',
    'pointermove',
    'pointerup',
    'wheel',
    'touchstart',
    'touchmove',
    'touchend',
    'keydown',
] as const;

/**
 * Slow westward drift of the globe while the create-patio map sits idle.
 *
 * The spin only runs while the sphere is actually on screen: past
 * `GLOBE_SPIN_MAX_ZOOM` the globe has flattened into the mercator plane, so the
 * frame loop keeps running but moves nothing until the camera pulls back out.
 * Any interaction parks it for `GLOBE_SPIN_IDLE_DELAY_MS`; reduced motion
 * disables it outright.
 *
 * Longitude is advanced with `setCenter` per frame rather than an `easeTo`
 * loop — no easing curve to fight, and a user grab lands on the exact frame it
 * happened rather than at the end of an in-flight animation.
 */
export const useGlobeIdleRotation = (): void => {
    const maps = useMap();
    const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];

    useEffect(
        function spinGlobeWhileIdle() {
            const map = mapRef?.getMap();
            if (!map || prefersReducedMotion()) {
                return;
            }

            const container = map.getContainer();
            let frame = 0;
            let idleTimer: ReturnType<typeof setTimeout> | undefined;
            let lastTime: number | undefined;
            // The per-frame `setCenter` below is itself a camera move that fires
            // `movestart`/`moveend`. This flag lets the move listeners ignore the
            // spin's own moves so it never parks itself.
            let selfMoving = false;

            const tick = (time: number) => {
                frame = requestAnimationFrame(tick);
                const deltaSec = lastTime === undefined ? 0 : (time - lastTime) / 1000;
                lastTime = time;

                // Globe gone (zoomed into the flat plane) — hold still.
                if (map.getZoom() > GLOBE_SPIN_MAX_ZOOM) {
                    return;
                }

                const center = map.getCenter();
                // `setCenter` calls `stop()` internally; guarding with `selfMoving`
                // keeps the `movestart`/`moveend` it emits from parking the spin or
                // re-arming the idle timer. `finally` guarantees the flag clears even
                // if a frame throws, so a real external move is never missed.
                selfMoving = true;
                try {
                    map.setCenter([center.lng - GLOBE_SPIN_DEG_PER_SEC * deltaSec, center.lat]);
                } finally {
                    selfMoving = false;
                }
            };

            const start = () => {
                if (frame) {
                    return;
                }
                lastTime = undefined;
                frame = requestAnimationFrame(tick);
            };

            const stop = () => {
                cancelAnimationFrame(frame);
                frame = 0;
            };

            const armIdle = () => {
                clearTimeout(idleTimer);
                idleTimer = setTimeout(start, GLOBE_SPIN_IDLE_DELAY_MS);
            };

            const handleInteraction = (event: Event) => {
                // Bare hover isn't an interaction — only a held drag is.
                if (event.type === 'pointermove' && (event as PointerEvent).buttons === 0) {
                    return;
                }
                stop();
                armIdle();
            };

            // Any camera move the spin didn't start — a programmatic `easeTo`/`flyTo`
            // from the control bar (rotate, reset-north, go-to-location), a geocoder
            // flight, or a cluster expand — parks the spin for its whole duration.
            // The control buttons sit outside the map container, so their clicks never
            // reach `handleInteraction`; gating on `movestart` catches them, and stops
            // the per-frame `setCenter` from cancelling the flight mid-air (which left
            // the globe transform non-invertible → "Invalid LngLat"/"failed to invert").
            const handleMoveStart = () => {
                if (selfMoving) {
                    return;
                }
                stop();
                clearTimeout(idleTimer);
            };

            const handleMoveEnd = () => {
                if (selfMoving) {
                    return;
                }
                armIdle();
            };

            // Capture phase: Mapbox stops propagation on its own canvas handlers.
            INTERACTION_EVENTS.forEach((event) => {
                return container.addEventListener(event, handleInteraction, { capture: true });
            });
            map.on('movestart', handleMoveStart);
            map.on('moveend', handleMoveEnd);

            start();

            return () => {
                stop();
                clearTimeout(idleTimer);
                INTERACTION_EVENTS.forEach((event) => {
                    return container.removeEventListener(event, handleInteraction, { capture: true });
                });
                map.off('movestart', handleMoveStart);
                map.off('moveend', handleMoveEnd);
            };
        },
        [mapRef]
    );
};
