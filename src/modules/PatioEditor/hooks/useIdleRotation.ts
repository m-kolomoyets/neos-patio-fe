import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { EDITOR_MAP_ID } from '../constants';

/** Idle delay (ms) of no interaction before the camera starts its idle orbit. */
const IDLE_DELAY_MS = 5_000;

/** Idle orbit speed (degrees of bearing per second) — slow, ambient. */
const ROTATION_DEG_PER_SEC = 3;

/** DOM events on the map container that count as "the user is interacting". */
const INTERACTION_EVENTS = ['pointerdown', 'wheel', 'touchstart', 'keydown'] as const;

/**
 * Ambient idle behaviour for the editor camera.
 *
 * After {@link IDLE_DELAY_MS} with no pointer/wheel/touch/key interaction on the
 * map container, the camera begins slowly orbiting (bearing advances at
 * {@link ROTATION_DEG_PER_SEC}). Any interaction stops the orbit immediately and
 * restarts the idle countdown — the orbit resumes from wherever the bearing
 * currently sits, never snapping back.
 *
 * Interaction is detected from DOM events (capture phase) rather than maplibre's
 * `move` events, so the orbit's own `setBearing` calls don't read as interaction
 * and the loop can't feed itself.
 */
export const useIdleRotation = () => {
    const maps = useMap();
    const map = maps[EDITOR_MAP_ID] ?? null;

    useEffect(() => {
        if (!map) return;

        const container = map.getContainer();
        const raw = map.getMap();

        let idleTimer: ReturnType<typeof setTimeout> | null = null;
        let frame: number | null = null;
        let lastTs: number | null = null;

        const tick = (ts: number) => {
            if (lastTs !== null) {
                const deltaSec = (ts - lastTs) / 1_000;
                raw.setBearing(raw.getBearing() + ROTATION_DEG_PER_SEC * deltaSec);
            }
            lastTs = ts;
            frame = requestAnimationFrame(tick);
        };

        const startOrbit = () => {
            if (frame !== null) return;
            lastTs = null;
            frame = requestAnimationFrame(tick);
        };

        const stopOrbit = () => {
            if (frame !== null) {
                cancelAnimationFrame(frame);
                frame = null;
            }
            lastTs = null;
        };

        const armIdle = () => {
            if (idleTimer !== null) clearTimeout(idleTimer);
            idleTimer = setTimeout(startOrbit, IDLE_DELAY_MS);
        };

        const onInteraction = () => {
            stopOrbit();
            armIdle();
        };

        INTERACTION_EVENTS.forEach((evt) => {
            container.addEventListener(evt, onInteraction, { capture: true, passive: true });
        });
        armIdle();

        return () => {
            INTERACTION_EVENTS.forEach((evt) => {
                container.removeEventListener(evt, onInteraction, { capture: true });
            });
            if (idleTimer !== null) clearTimeout(idleTimer);
            stopOrbit();
        };
    }, [map]);
};
