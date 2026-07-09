import type { Scene } from 'cesium';
import { Cartographic } from 'cesium';

/**
 * Sample the real surface height at a lng/lat using the most detailed tiles,
 * loading them if needed. Used to re-ground an object to the surface (e.g. on a
 * translate drag-end) and to resolve the camera orbit target. `objectsToExclude`
 * keeps a dragged model from sampling its own mesh. Resolves to `undefined` when
 * no surface is found.
 */
export const sampleSurfaceHeight = async (
    scene: Scene,
    lng: number,
    lat: number,
    objectsToExclude?: object[]
): Promise<number | undefined> => {
    const carto = Cartographic.fromDegrees(lng, lat);
    const [sampled] = await scene.sampleHeightMostDetailed([carto], objectsToExclude);
    return sampled?.height;
};
