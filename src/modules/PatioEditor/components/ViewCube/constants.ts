import type { CubeTarget } from './types';
import { DEFAULT_ZOOM } from '../MapCanvas/constants';

/** Duration (ms) for every programmatic camera move (snap, arrows, home, zoom presets). */
export const CAMERA_EASE_MS = 400;

/**
 * Zoom that reads as 100% on the stepper. Anchored to the editor's default
 * zoom so the percentage is "scale relative to the framing the editor opens at".
 */
export const REFERENCE_ZOOM = DEFAULT_ZOOM;

/** Zoom-popover preset percentages; fall on adjacent integer zoom levels (×2 per level). */
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
 * Maplibre is a geographic camera (pitch clamped 0–{@link MAX_PITCH}, always
 * looking down at the ground), so side "elevations" are pseudo-elevations at
 * max pitch and there are no edge targets — only 6 faces + 4 corners.
 *
 * `bearing: null` means "leave bearing unchanged" (used by the top face).
 * Consumed by the snap logic in issue #03; defined here so the mapping lives
 * in one pure, testable place.
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
