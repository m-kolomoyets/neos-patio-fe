import { Cartesian3 } from 'cesium';

/** Below this, the mouse ray and axis are treated as parallel (closest point undefined). */
const PARALLEL_EPSILON = 1e-6;

/**
 * Closest point on an infinite axis line to a ray, in world (ECEF) space.
 *
 * Both the mouse ray and the gizmo axis are treated as infinite lines; the point
 * on the axis nearest the ray is the new grab target. This is robust across zoom
 * and view angle (unlike projecting onto a plane), and gracefully handles the
 * near-parallel case by falling back to the axis origin.
 *
 * Derivation: minimise the squared distance between line `axis(s) = axisPoint +
 * s·u` and ray `ray(t) = rayOrigin + t·v`. With `u`,`v` unit vectors and
 * `w0 = axisPoint − rayOrigin`, the minimising `s = (b·e − d) / (1 − b²)` where
 * `b = u·v`, `d = u·w0`, `e = v·w0`. The denominator `1 − b²` vanishes when the
 * lines are parallel.
 */
export const closestPointOnAxis = (
    rayOrigin: Cartesian3,
    rayDirection: Cartesian3,
    axisPoint: Cartesian3,
    axisDirection: Cartesian3
): Cartesian3 => {
    const u = Cartesian3.normalize(axisDirection, new Cartesian3());
    const v = Cartesian3.normalize(rayDirection, new Cartesian3());
    const w0 = Cartesian3.subtract(axisPoint, rayOrigin, new Cartesian3());

    const b = Cartesian3.dot(u, v);
    const d = Cartesian3.dot(u, w0);
    const e = Cartesian3.dot(v, w0);
    const denom = 1 - b * b;

    // Near-parallel: the closest point is ill-defined, so don't move the axis.
    if (Math.abs(denom) < PARALLEL_EPSILON) {
        return Cartesian3.clone(axisPoint, new Cartesian3());
    }

    const s = (b * e - d) / denom;
    return Cartesian3.add(axisPoint, Cartesian3.multiplyByScalar(u, s, new Cartesian3()), new Cartesian3());
};

/**
 * Intersection of a ray with an infinite plane, in world (ECEF) space. Used in
 * rotate mode: the plane is the ring's plane (through the object origin, normal =
 * the world rotation axis), so the hit point tracks where the cursor grabs the
 * ring. Returns `null` when the ray is parallel to the plane.
 */
export const rayPlaneIntersection = (
    rayOrigin: Cartesian3,
    rayDirection: Cartesian3,
    planeOrigin: Cartesian3,
    planeNormal: Cartesian3
): Cartesian3 | null => {
    const v = Cartesian3.normalize(rayDirection, new Cartesian3());
    const n = Cartesian3.normalize(planeNormal, new Cartesian3());

    const denom = Cartesian3.dot(n, v);
    if (Math.abs(denom) < PARALLEL_EPSILON) return null;

    const w0 = Cartesian3.subtract(planeOrigin, rayOrigin, new Cartesian3());
    const t = Cartesian3.dot(n, w0) / denom;
    return Cartesian3.add(rayOrigin, Cartesian3.multiplyByScalar(v, t, new Cartesian3()), new Cartesian3());
};

/**
 * Signed angle (radians) from `from` to `to` measured about `axis`, right-handed.
 * In rotate mode both vectors are `hitPoint − origin` for the previous and current
 * cursor positions on a ring; the result is the rotation delta to apply about that
 * world axis. `atan2(axis·(from×to), from·to)` is stable across the full ±π range,
 * unlike `acos` of a normalized dot.
 */
export const signedAngleAboutAxis = (from: Cartesian3, to: Cartesian3, axis: Cartesian3): number => {
    const n = Cartesian3.normalize(axis, new Cartesian3());
    const cross = Cartesian3.cross(from, to, new Cartesian3());
    const sin = Cartesian3.dot(n, cross);
    const cos = Cartesian3.dot(from, to);
    return Math.atan2(sin, cos);
};

/** Below this start distance, the scale ratio is ill-defined and falls back to 1. */
const MIN_SCALE_DISTANCE = 1e-6;

/**
 * Uniform scale factor for a scale drag: the ratio of the cursor's current
 * distance from the gizmo origin to its distance at grab time. In scale mode both
 * distances are measured from the object origin to the cursor's closest point on
 * the grabbed world axis line; multiplying the start scale by this ratio gives the
 * live uniform scale. Falls back to `1` when the grab started effectively at the
 * origin, so the model never jumps to an infinite scale.
 */
export const scaleRatio = (startDistance: number, currentDistance: number): number => {
    if (startDistance < MIN_SCALE_DISTANCE) return 1;
    return currentDistance / startDistance;
};

/**
 * Convert a signed cumulative rotation in radians to the whole-degree value shown
 * in the live readout. Kept cumulative (not wrapped to ±180°) so multi-turn and
 * back-and-forth drags read correctly, and returning to the start reads `0`.
 */
export const radiansToDisplayDegrees = (radians: number): number => {
    return Math.round((radians * 180) / Math.PI);
};
