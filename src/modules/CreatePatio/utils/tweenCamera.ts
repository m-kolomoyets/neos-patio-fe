import type { Map as MapboxMap } from 'mapbox-gl';
import { prefersReducedMotion } from './prefersReducedMotion';

export type CameraTarget = {
    /** Destination center as `[lng, lat]`. Omitted → center is left untouched. */
    center?: [number, number];
    /** Destination zoom. Omitted → zoom is left untouched. */
    zoom?: number;
    /** Destination bearing in degrees. Omitted → bearing is left untouched. */
    bearing?: number;
};

/** Default tween length in ms — matches Mapbox's eased-move feel. */
const DEFAULT_DURATION_MS = 300;

const easeOutCubic = (t: number): number => {
    return 1 - (1 - t) ** 3;
};

/** Shortest signed path from `from`→`to` in degrees, so a turn never spins the long way. */
const shortestBearingDelta = (from: number, to: number): number => {
    return ((to - from + 540) % 360) - 180;
};

/**
 * Animates the camera to `target` by interpolating with the *instant* setter
 * (`jumpTo`) each frame, instead of Mapbox's eased `easeTo`/`flyTo`.
 *
 * On this pitch-0 globe those eased methods interpolate around an unprojected
 * screen anchor that resolves to NaN, so the ease frame builds a non-invertible
 * matrix ("Invalid LngLat (NaN, NaN)" / "failed to invert matrix") and the
 * camera locks up. Driving `jumpTo` frame-by-frame keeps every intermediate
 * transform valid — instant setters never hit that path.
 *
 * Returns a cancel function; reduced motion applies the target instantly.
 */
export const tweenCamera = (map: MapboxMap, target: CameraTarget, durationMs = DEFAULT_DURATION_MS): (() => void) => {
    if (prefersReducedMotion()) {
        map.jumpTo(target);
        return () => {};
    }

    const start = map.getCenter();
    const from = { lng: start.lng, lat: start.lat, zoom: map.getZoom(), bearing: map.getBearing() };
    const bearingDelta = target.bearing === undefined ? 0 : shortestBearingDelta(from.bearing, target.bearing);
    const startTime = performance.now();
    let frame: number | undefined;

    const step = (now: number) => {
        const k = easeOutCubic(Math.min(1, (now - startTime) / durationMs));

        const next: CameraTarget = {};
        if (target.center !== undefined) {
            next.center = [from.lng + (target.center[0] - from.lng) * k, from.lat + (target.center[1] - from.lat) * k];
        }
        if (target.zoom !== undefined) {
            next.zoom = from.zoom + (target.zoom - from.zoom) * k;
        }
        if (target.bearing !== undefined) {
            next.bearing = from.bearing + bearingDelta * k;
        }
        map.jumpTo(next);

        if (k < 1) {
            frame = requestAnimationFrame(step);
        }
    };

    frame = requestAnimationFrame(step);

    return () => {
        if (frame !== undefined) {
            cancelAnimationFrame(frame);
        }
    };
};
