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

/**
 * Pitch (deg) the side faces (N/E/S/W) snap to: an angled-down "elevation"
 * rather than a near-horizon look. At true horizon (≈{@link MAX_PITCH}) the
 * camera stares across the patio and the bottom half of the frame fills with the
 * flat out-of-bounds ground/sea in front of it; angling down keeps the framed
 * patio filling the screen instead. Paired with the snap framing in
 * `useCesiumCamera` (range clamped so the patio bounds always fill the view).
 */
export const SIDE_PITCH = 60;

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
 * "elevations" sit at {@link SIDE_PITCH} (angled down, not near-horizon, so the
 * framed patio fills the view); the 4 corners are true top-vertex isometric 3/4
 * views (pitch 35, a balanced top + two sides). The 4 vertical edges (corner-on,
 * pitch 60) and 4 top edges (top tilted to one side, pitch 30) complete the 17
 * targets the 3×3 hit model exposes.
 *
 * `bearing: null` means "leave bearing unchanged" (used by the top face).
 * Consumed by the snap logic; defined here so the mapping lives in one pure,
 * testable place.
 */
export const CUBE_TARGETS: Record<CubeTarget, { bearing: number | null; pitch: number }> = {
    top: { bearing: null, pitch: 0 },
    north: { bearing: 0, pitch: SIDE_PITCH },
    east: { bearing: 90, pitch: SIDE_PITCH },
    south: { bearing: 180, pitch: SIDE_PITCH },
    west: { bearing: 270, pitch: SIDE_PITCH },
    // Corners / edges use direct manipulation: the CLICKED corner/edge ends up
    // facing the viewer. The cube mirrors the camera heading, so the target
    // facing the viewer is opposite the heading — hence each bearing is its
    // geometric compass direction + 180 (e.g. the NE corner faces the viewer
    // when the camera looks SW, heading 225).
    northeast: { bearing: 225, pitch: 35 },
    southeast: { bearing: 315, pitch: 35 },
    southwest: { bearing: 45, pitch: 35 },
    northwest: { bearing: 135, pitch: 35 },
    // Vertical edges: corner-on between two sides (steeper pitch than the corner).
    'edge-ne': { bearing: 225, pitch: 60 },
    'edge-se': { bearing: 315, pitch: 60 },
    'edge-sw': { bearing: 45, pitch: 60 },
    'edge-nw': { bearing: 135, pitch: 60 },
    // Top edges: top tilted toward one side (shallower pitch).
    'edge-top-n': { bearing: 180, pitch: 30 },
    'edge-top-e': { bearing: 270, pitch: 30 },
    'edge-top-s': { bearing: 0, pitch: 30 },
    'edge-top-w': { bearing: 90, pitch: 30 },
};
