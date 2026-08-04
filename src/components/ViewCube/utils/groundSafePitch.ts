import type { Scene } from 'cesium';
import { Cartesian3, Cartographic, Matrix4, Transforms } from 'cesium';
import { clearanceForDistance, sampleGroundHeight } from '@/lib/utils/groundFloor';
import { bearingToHeading, displayPitchToCesium } from './cameraMath';

/** Steps (deg) walked back from the requested pitch while the camera sits under the surface. */
const BACKOFF_STEP_DEG = 2;

/**
 * Floor for the back-off: below this the snap would stop reading as an elevation
 * view at all, and the per-frame ground floor (`useGroundFloor`) still guards
 * whatever slips through.
 */
const MIN_SAFE_PITCH = 30;

/**
 * World position a `lookAt(target, HeadingPitchRange)` would place the camera at.
 *
 * Mirrors Cesium's own offset math in the target's east-north-up frame: the
 * camera sits `range · cos(cesiumPitch)` out horizontally, opposite the heading
 * it looks along, and `-range · sin(cesiumPitch)` up (Cesium pitch is negative
 * looking down, so a display pitch of 90 — level — puts it at the target's own
 * altitude).
 */
export const cameraPositionFor = (target: Cartesian3, bearing: number, pitch: number, range: number): Cartesian3 => {
    const heading = bearingToHeading(bearing);
    const cesiumPitch = displayPitchToCesium(pitch);
    const horizontal = range * Math.cos(cesiumPitch);
    const local = new Cartesian3(
        -horizontal * Math.sin(heading),
        -horizontal * Math.cos(heading),
        -range * Math.sin(cesiumPitch)
    );
    return Matrix4.multiplyByPoint(Transforms.eastNorthUpToFixedFrame(target), local, new Cartesian3());
};

/**
 * Largest pitch (deg) ≤ `pitch` that keeps the camera above the surface.
 *
 * The side faces snap to a level CAD elevation ({@link SIDE_PITCH} = 90), which
 * puts the camera at the orbit target's own altitude — under the mesh wherever
 * the ground rises between the patio and the camera, or wherever the pivot sits
 * near ground level to begin with. So the requested pitch is walked back in
 * {@link BACKOFF_STEP_DEG} steps (each one lifts the camera) until the sampled
 * surface under the resulting camera position clears it by
 * {@link clearanceForDistance} — the same distance-scaled margin the free-camera
 * ground floor enforces, so the snap lands exactly where that wall would let it
 * sit rather than being shoved back a frame later.
 *
 * Returns `pitch` unchanged when the surface can't be judged (height sampling
 * unsupported, or the tiles under the camera haven't streamed): "no sample"
 * means "unknown", not "no ground", and `useGroundFloor` still catches it live.
 */
export const groundSafePitch = (
    scene: Scene,
    target: Cartesian3,
    { bearing, pitch, range }: { bearing: number; pitch: number; range: number }
): number => {
    const clearance = clearanceForDistance(range);

    for (let candidate = pitch; candidate > MIN_SAFE_PITCH; candidate -= BACKOFF_STEP_DEG) {
        const carto = Cartographic.fromCartesian(cameraPositionFor(target, bearing, candidate, range));
        if (!carto) {
            return candidate;
        }
        const surface = sampleGroundHeight(scene, carto);
        if (surface === undefined || carto.height >= surface + clearance) {
            return candidate;
        }
    }
    return MIN_SAFE_PITCH;
};
