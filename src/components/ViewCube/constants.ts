import type { Axis3, CubeFace, CubeTarget, FaceId } from './types';
import { NINETY_DEGREES } from '@/lib/constants';

/** Single-letter labels for the flattened head-on face. */
export const FACE_LABELS: Record<CubeFace, string> = { north: 'N', east: 'E', south: 'S', west: 'W' };

/**
 * The 4 side faces in clockwise (bearing-increasing) order. Index + 1 steps a
 * quarter-turn right (bearing +90°), - 1 steps left; consumed by {@link stepFace}.
 */
export const FACE_ORDER: CubeFace[] = ['north', 'east', 'south', 'west'];

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

/** Bearing change (deg) per rotate-button press — a quarter-turn matching the N/E/S/W faces. */
export const ROTATE_STEP_DEG = NINETY_DEGREES;

/** localStorage key prefix for the per-patio Home view (`${prefix}${patioId}`). */
export const HOME_STORAGE_PREFIX = 'patio-editor:home:';

/**
 * Maximum pitch (deg) — a level, horizontal look (Cesium pitch 0). The camera
 * then sits at the orbit target's own altitude, so this is only reachable where
 * the terrain allows it; `groundSafePitch` backs it off wherever the camera
 * would end up inside/under the mesh.
 */
export const MAX_PITCH = 90;

/**
 * Pitch (deg) the side faces (N/E/S/W) snap to: a true CAD-style elevation —
 * the camera level with the patio, looking horizontally, with no extra tilt.
 * Reached only when the surface under that camera position leaves room for it
 * (see `groundSafePitch`), otherwise the snap tilts down by the minimum needed
 * to stay above ground. Paired with the snap framing in `useCesiumCamera`
 * (range clamped so the patio bounds always fill the view).
 */
export const SIDE_PITCH = MAX_PITCH;

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
 * Values are display units (pitch 0 = top-down, {@link MAX_PITCH} = level with
 * the target), converted to Cesium heading/pitch radians by the camera adapter.
 * Side "elevations" sit at {@link SIDE_PITCH} — a level, CAD-style head-on view
 * with no extra tilt, backed off only where the terrain would swallow the
 * camera; the 4 corners are true top-vertex isometric 3/4
 * views (pitch 35, a balanced top + two sides). The 4 vertical edges (corner-on,
 * pitch 60) and 4 top edges (top tilted to one side, pitch 30) complete the 17
 * targets the 3×3 hit model exposes.
 *
 * `bearing: null` means "leave bearing unchanged" (used by the top face).
 * Consumed by the snap logic; defined here so the mapping lives in one pure,
 * testable place.
 */
export const CUBE_TARGETS: Record<CubeTarget, { bearing: number | null; pitch: number }> = {
    // Top-down is always north-up (azimuth 0), however it's reached (cube top
    // face or the flattened up-arrow) — never inheriting a stale rotation.
    top: { bearing: 0, pitch: 0 },
    // Side faces use direct manipulation like the corners: the CLICKED face ends
    // up facing the viewer. The cube mirrors the camera heading, so the face
    // facing the viewer is opposite the heading — hence each bearing is its
    // geometric compass direction + 180 (click N → camera looks south from the
    // north side, so the north face fills the view).
    north: { bearing: 180, pitch: SIDE_PITCH },
    east: { bearing: 270, pitch: SIDE_PITCH },
    south: { bearing: 0, pitch: SIDE_PITCH },
    west: { bearing: NINETY_DEGREES, pitch: SIDE_PITCH },
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
    'edge-top-w': { bearing: NINETY_DEGREES, pitch: 30 },
};

/**
 * Body-frame basis of each face's local 3×3 grid.
 *
 * Cube-body axes (derived from the CSS face transforms): `x` E+ / W−, `y` S+ /
 * N−, `z` Top+ / Bottom−. `fixed` is the face's outward normal; `ax`/`ay` are
 * the body directions its grid columns / rows advance along. A cell's body
 * vector is `fixed + ax·(col−1) + ay·(row−1)` — see {@link cellVector}.
 */
export const FACE_BASIS: Record<FaceId, { fixed: Axis3; ax: Axis3; ay: Axis3 }> = {
    top: { fixed: [0, 0, 1], ax: [1, 0, 0], ay: [0, 1, 0] },
    north: { fixed: [0, -1, 0], ax: [1, 0, 0], ay: [0, 0, 1] },
    south: { fixed: [0, 1, 0], ax: [1, 0, 0], ay: [0, 0, -1] },
    east: { fixed: [1, 0, 0], ax: [0, -1, 0], ay: [0, 0, -1] },
    west: { fixed: [-1, 0, 0], ax: [0, 1, 0], ay: [0, 0, -1] },
};

/** Row/col indices of a face's 3×3 grid, top-left = (0,0). */
export const GRID_INDICES = [0, 1, 2] as const;
