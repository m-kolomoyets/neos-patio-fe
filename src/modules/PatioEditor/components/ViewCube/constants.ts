import type { CubeTarget } from './types';

/** Duration (ms) for every programmatic camera move (snap, arrows, home, zoom presets). */
export const CAMERA_EASE_MS = 400;

/** Same duration in seconds — the unit Cesium's `flyTo`/`flyToBoundingSphere` expects. */
export const CAMERA_EASE_S = CAMERA_EASE_MS / 1_000;

/** Display orientation the editor opens at and Home defaults to (pitch is maplibre-style). */
export const DEFAULT_BEARING = 0;
export const DEFAULT_PITCH = 45;

/** Each `−`/`+` step on the zoom stepper halves / doubles the camera range (a 2× scale change). */
export const ZOOM_STEP_FACTOR = 2;

/** Zoom-popover preset percentages; each is a ×2 range factor from the reference. */
export const ZOOM_PRESETS = [50, 100, 200] as const;

/** localStorage key prefix for the per-patio Home view (`${prefix}${patioId}`). */
export const HOME_STORAGE_PREFIX = 'patio-editor:home:';

/** Maximum map pitch (deg). Mirrors the `maxPitch` set on the `<Map>`. */
export const MAX_PITCH = 85;

/** Drag-orbit sensitivity (degrees of camera rotation per pixel dragged). */
export const DRAG_SENSITIVITY = 0.5;

/**
 * How far (deg, bearing or pitch) the camera may drift from a snapped side face
 * before the flattened "selected face" state exits back to the live 3D cube.
 */
export const FLATTEN_EXIT_THRESHOLD_DEG = 8;

/**
 * Pointer travel (px) below which a press-release counts as a click (→ snap)
 * rather than a drag (→ orbit). Distinguishes the two gestures on the cube.
 */
export const CLICK_THRESHOLD_PX = 4;

/**
 * Face / corner → camera orientation table.
 *
 * Values are display units (pitch 0 = top-down, {@link MAX_PITCH} ≈ horizon),
 * converted to Cesium heading/pitch radians by the camera adapter. Side
 * "elevations" sit at near-max pitch and there are no edge targets — only the
 * top face + 4 sides + 4 corners.
 *
 * `bearing: null` means "leave bearing unchanged" (used by the top face).
 * Consumed by the snap logic; defined here so the mapping lives in one pure,
 * testable place.
 */
export const CUBE_TARGETS: Record<CubeTarget, { bearing: number | null; pitch: number }> = {
    top: { bearing: null, pitch: 0 },
    north: { bearing: 0, pitch: MAX_PITCH },
    east: { bearing: 90, pitch: MAX_PITCH },
    south: { bearing: 180, pitch: MAX_PITCH },
    west: { bearing: 270, pitch: MAX_PITCH },
    northeast: { bearing: 45, pitch: 60 },
    southeast: { bearing: 135, pitch: 60 },
    southwest: { bearing: 225, pitch: 60 },
    northwest: { bearing: 315, pitch: 60 },
};
