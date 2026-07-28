import type { Cartographic, Scene } from 'cesium';

/** Never let the camera sit closer than this to the ground surface (metres). */
const MIN_CLEARANCE_M = 2;

/**
 * Clearance grows with the view distance: Cesium scales the near clip plane with
 * how far the camera is from what it looks at, so a fixed metre margin that reads
 * fine up close lets distant ground poke through the near plane when zoomed out.
 * Tying clearance to `refDist` keeps the same visual gap above the surface at any
 * zoom.
 */
const CLEARANCE_RATIO = 0.04;

/** Ground clearance (m) for a camera whose reference view distance is `refDist`. */
export const clearanceForDistance = (refDist: number): number => {
    return Math.max(MIN_CLEARANCE_M, CLEARANCE_RATIO * refDist);
};

/**
 * Synchronous surface height (m) under `carto`'s lng/lat, from the tiles already
 * rendered in the current view — cheap enough to call every frame (it runs its
 * own small offscreen pick). Only the longitude/latitude of `carto` are read.
 *
 * Returns `undefined` when height sampling is unsupported (no depth texture / not
 * 3D mode) or the tiles under that point have not streamed in yet, so callers
 * must treat "no sample" as "can't judge", not "no ground".
 */
export const sampleGroundHeight = (scene: Scene, carto: Cartographic): number | undefined => {
    if (!scene.sampleHeightSupported) {
        return undefined;
    }
    return scene.sampleHeight(carto);
};
