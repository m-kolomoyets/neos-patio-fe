import type { Viewer } from 'cesium';
import type { PlacedObject } from '@/services/patios/types';
import { BoundingSphere, Cartesian3, HeadingPitchRange } from 'cesium';

/** Duration (s) of the zoom-to-object flight. Matches the ViewCube camera eases. */
const FLY_DURATION_S = 0.4;
const FLY_DURATION_MS = FLY_DURATION_S * 1_000;

/**
 * Bounding-sphere radius (m) for an object at `scale === 1`. The flight frames
 * this sphere, so the camera ends up the same relative distance from a small or
 * large object — only the absolute range changes with `scale`.
 */
const BASE_OBJECT_RADIUS = 15;

/**
 * Pump `scene.requestRender()` once per frame for `durationMs` so a Cesium
 * camera flight advances under `requestRenderMode` (where the scene otherwise
 * renders only on explicit request). Self-cancels on viewer teardown. Mirrors
 * the ViewCube camera's pump, kept local so this helper stays self-contained
 * (the ViewCube hook is folder-scoped and must not be imported here).
 */
const pumpRenderDuringFlight = (viewer: Viewer, durationMs: number) => {
    let elapsed = 0;
    let last: number | null = null;
    const tick = (ts: number) => {
        if (viewer.isDestroyed()) return;
        if (last !== null) elapsed += ts - last;
        last = ts;
        viewer.scene.requestRender();
        if (elapsed < durationMs) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

/**
 * Fly the camera to frame a placed object. Geo-only: the target is derived from
 * the object's `lng`/`lat`/`height` and the frame radius is scaled from its
 * `scale` — the live glTF bounds are never read, so this works even before the
 * model has loaded. Keeps the current heading/pitch and frames the sphere so it
 * fits fully inside the viewport (both dimensions) with a little padding.
 */
const FIT_PADDING = 1.2;

export const flyToObject = (viewer: Viewer, object: PlacedObject) => {
    const center = Cartesian3.fromDegrees(object.lng, object.lat, object.height);
    const radius = BASE_OBJECT_RADIUS * object.scale;
    const { camera } = viewer;

    // Range at which the sphere fits the viewport: the binding axis is the
    // narrower field of view, so fit to the smaller half-angle (largest range).
    // `range = radius / sin(halfAngle)` puts the sphere tangent to that frustum
    // plane; padding adds breathing room.
    const { frustum } = camera;
    const fovy = 'fovy' in frustum ? frustum.fovy : undefined;
    const aspect = 'aspectRatio' in frustum ? frustum.aspectRatio : undefined;
    let range = radius * 3; // safe fallback if frustum lacks a fov
    if (typeof fovy === 'number' && Number.isFinite(fovy)) {
        const halfV = fovy / 2;
        const halfH = typeof aspect === 'number' && aspect > 0 ? Math.atan(Math.tan(halfV) * aspect) : halfV;
        const halfAngle = Math.min(halfV, halfH);
        range = (radius / Math.sin(halfAngle)) * FIT_PADDING;
    }

    const offset = new HeadingPitchRange(camera.heading, camera.pitch, range);
    camera.flyToBoundingSphere(new BoundingSphere(center, radius), {
        offset,
        duration: FLY_DURATION_S,
    });
    pumpRenderDuringFlight(viewer, FLY_DURATION_MS);
};
