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

            const tick = (time: number) => {
                frame = requestAnimationFrame(tick);
                const deltaSec = lastTime === undefined ? 0 : (time - lastTime) / 1000;
                lastTime = time;

                // Globe gone (zoomed into the flat plane) — hold still. Same while a
                // programmatic flight is in the air (search, cluster expand, zoom-in
                // bridge) so the spin never fights an easing camera.
                if (map.getZoom() > GLOBE_SPIN_MAX_ZOOM || map.isEasing()) {
                    return;
                }

                const center = map.getCenter();
                map.setCenter([center.lng - GLOBE_SPIN_DEG_PER_SEC * deltaSec, center.lat]);
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

            // Capture phase: Mapbox stops propagation on its own canvas handlers.
            INTERACTION_EVENTS.forEach((event) => {
                return container.addEventListener(event, handleInteraction, { capture: true });
            });

            start();

            return () => {
                stop();
                clearTimeout(idleTimer);
                INTERACTION_EVENTS.forEach((event) => {
                    return container.removeEventListener(event, handleInteraction, { capture: true });
                });
            };
        },
        [mapRef]
    );
};
