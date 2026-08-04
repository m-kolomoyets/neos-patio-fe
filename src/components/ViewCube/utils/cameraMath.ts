import type { CameraState, CubeFace, CubeTarget } from '../types';
import { Math as CesiumMath } from 'cesium';
import { CUBE_TARGETS, MAX_PITCH } from '../constants';

/**
 * The 4 side faces in clockwise (bearing-increasing) order. Index + 1 steps a
 * quarter-turn right (bearing +90°), - 1 steps left; consumed by {@link stepFace}.
 */
export const FACE_ORDER: CubeFace[] = ['north', 'east', 'south', 'west'];

/** Clamp pitch to the map's valid range (0–{@link MAX_PITCH}). */
export const clampPitch = (pitch: number): number => {
    return Math.min(MAX_PITCH, Math.max(0, pitch));
};

/** Normalize a bearing to the [0, 360) range. */
export const normalizeBearing = (bearing: number): number => {
    return ((bearing % 360) + 360) % 360;
};

/**
 * CSS 3D transform that mirrors the live map camera onto the cube.
 *
 * `rotateZ(-bearing)` spins the cube about its vertical axis (signed so the N
 * face sits up/back at bearing 0), then `rotateX(pitch)` tilts the top toward
 * the viewer as the map is pitched. Pure + testable: bearing/pitch → transform.
 */
export const cubeTransform = ({ bearing, pitch }: Pick<CameraState, 'bearing' | 'pitch'>): string => {
    return `rotateX(${pitch}deg) rotateZ(${-normalizeBearing(bearing)}deg)`;
};

/** Resolved camera orientation a click on a cube target snaps to. */
export type SnapOrientation = { bearing: number; pitch: number };

/**
 * Resolve a clicked cube target → the `{ bearing, pitch }` to `easeTo`.
 *
 * Looks up {@link CUBE_TARGETS}; a `null` bearing (the top face) means "keep
 * the current bearing", so the live bearing is passed through unchanged. Pure +
 * testable: target + current bearing → orientation.
 */
export const resolveSnapOrientation = (target: CubeTarget, currentBearing: number): SnapOrientation => {
    const { bearing, pitch } = CUBE_TARGETS[target];
    return { bearing: normalizeBearing(bearing ?? currentBearing), pitch };
};

/**
 * Orbit the camera from the gesture start by a pixel delta.
 *
 * Horizontal drag (`dx`) turns bearing, vertical drag (`dy`) tilts pitch, both
 * scaled by `sensitivity` (deg/px); pitch is clamped to 0–{@link MAX_PITCH} and
 * bearing wraps. Accumulates from the drag-start orientation (not per-frame) so
 * the result is drift-free. Pure + testable.
 */
export const orbitCamera = (start: SnapOrientation, dx: number, dy: number, sensitivity: number): SnapOrientation => {
    return {
        bearing: normalizeBearing(start.bearing + dx * sensitivity),
        pitch: clampPitch(start.pitch - dy * sensitivity),
    };
};

/** A {@link CubeTarget} is a side face iff it sits in {@link FACE_ORDER}. */
export const isCubeFace = (target: CubeTarget): target is CubeFace => {
    return (FACE_ORDER as CubeTarget[]).includes(target);
};

/**
 * Step from a side face to its neighbor a quarter-turn away.
 *
 * `dir` +1 → right (bearing +90°), -1 → left (bearing -90°); wraps around the
 * 4-face ring. Pure + testable: drives the flattened-mode left/right arrows.
 */
export const stepFace = (face: CubeFace, dir: 1 | -1): CubeFace => {
    const idx = FACE_ORDER.indexOf(face);
    return FACE_ORDER[(idx + dir + FACE_ORDER.length) % FACE_ORDER.length];
};

/**
 * Camera range (meters) → readout percentage, anchored so `refRange` reads 100%.
 *
 * Cesium has no discrete zoom levels; "zoom" is the camera's distance to the
 * orbit target. Closer = more zoomed in = higher percentage, so the readout is
 * the inverse ratio `refRange / range · 100` (half the range reads 200%, double
 * reads 50%). Pure + testable; inverse of {@link percentToRange}.
 */
export const rangeToPercent = (range: number, refRange: number): number => {
    return (refRange / range) * 100;
};

/**
 * Readout percentage → camera range (meters), anchored so 100% maps to
 * `refRange`. Inverts {@link rangeToPercent}: `refRange · 100 / percent`. Drives
 * the 50/100/200% popover presets. Pure + testable.
 */
export const percentToRange = (percent: number, refRange: number): number => {
    return (refRange * 100) / percent;
};

/**
 * Convert a display bearing (deg, clockwise from north) → Cesium camera heading
 * (radians, same convention). The cube and maplibre-era bearing share Cesium's
 * heading convention, so this is a plain degrees→radians map.
 */
export const bearingToHeading = (bearing: number): number => {
    return CesiumMath.toRadians(normalizeBearing(bearing));
};

/** Inverse of {@link bearingToHeading}: Cesium heading (rad) → display bearing (deg). */
export const headingToBearing = (heading: number): number => {
    return normalizeBearing(CesiumMath.toDegrees(heading));
};

/**
 * Convert a display pitch (deg, 0 = top-down, {@link MAX_PITCH} ≈ horizon) →
 * Cesium camera pitch (rad, -90° = straight down, 0 = horizon). The cube reads
 * pitch in the maplibre sense, so `displayPitch − 90` gives the Cesium pitch.
 */
export const displayPitchToCesium = (pitch: number): number => {
    return CesiumMath.toRadians(clampPitch(pitch) - 90);
};

/** Inverse of {@link displayPitchToCesium}: Cesium pitch (rad) → display pitch (deg). */
export const cesiumPitchToDisplay = (pitch: number): number => {
    return clampPitch(CesiumMath.toDegrees(pitch) + 90);
};

/** Shortest absolute angle (deg, 0–180) between two bearings, wrap-aware. */
export const angularDistance = (a: number, b: number): number => {
    const d = Math.abs(normalizeBearing(a) - normalizeBearing(b)) % 360;
    return d > 180 ? 360 - d : d;
};

/**
 * Whether the live camera is still framing a given side face within tolerance.
 *
 * True while both bearing (wrap-aware) and pitch sit within `toleranceDeg` of
 * the face's snapped orientation. The flattened state exits once this goes
 * false (the user orbited away).
 *
 * `appliedPitch` overrides the face's nominal pitch with the one the snap
 * actually landed on — the ground back-off (`groundSafePitch`) can tilt the
 * level elevation down well past `toleranceDeg` on raised terrain, and without
 * this the flattened state would exit the moment it was entered. Pure + testable.
 */
export const isSnappedToFace = (
    { bearing, pitch }: Pick<CameraState, 'bearing' | 'pitch'>,
    face: CubeFace,
    toleranceDeg: number,
    appliedPitch?: number
): boolean => {
    const target = CUBE_TARGETS[face];
    return (
        target.bearing !== null &&
        angularDistance(bearing, target.bearing) <= toleranceDeg &&
        Math.abs(pitch - (appliedPitch ?? target.pitch)) <= toleranceDeg
    );
};
