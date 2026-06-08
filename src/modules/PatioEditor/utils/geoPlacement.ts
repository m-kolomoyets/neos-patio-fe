import type { Cartesian2, Scene } from 'cesium';
import type { PatioBounds } from '@/services/patios/types';
import { Cartesian3, Cartographic, Math as CesiumMath, Ellipsoid, HeadingPitchRoll, Matrix4, Transforms } from 'cesium';

/**
 * The geographic + HPR pose of a placed object. A {@link PlacedObject} is a
 * structural superset of this, so it can be passed wherever a `GeoPose` is
 * expected.
 */
export type GeoPose = {
    lng: number;
    lat: number;
    height: number;
    heading: number;
    pitch: number;
    roll: number;
    scale: number;
};

export type GeoPoint = { lng: number; lat: number; height: number };

/**
 * Build a Cesium model matrix from a geographic + HPR pose: an east-north-up
 * frame at the geographic origin, oriented by heading/pitch/roll and uniformly
 * scaled. This is the canonical geographic↔`modelMatrix` conversion the editor
 * stores objects as and feeds to `Model.modelMatrix`.
 */
export const geoPoseToModelMatrix = (pose: GeoPose): Matrix4 => {
    const origin = Cartesian3.fromDegrees(pose.lng, pose.lat, pose.height);
    const hpr = new HeadingPitchRoll(pose.heading, pose.pitch, pose.roll);
    const matrix = Transforms.headingPitchRollToFixedFrame(origin, hpr);
    return Matrix4.multiplyByUniformScale(matrix, pose.scale, matrix);
};

/** Clamp a lng/lat into the patio rectangle `[west, south, east, north]`. */
export const clampToBounds = (bounds: PatioBounds, point: { lng: number; lat: number }) => {
    const [west, south, east, north] = bounds;
    return {
        lng: Math.min(Math.max(point.lng, west), east),
        lat: Math.min(Math.max(point.lat, south), north),
    };
};

const cartesianToGeo = (cartesian: Cartesian3): GeoPoint => {
    const carto = Cartographic.fromCartesian(cartesian);
    return {
        lng: CesiumMath.toDegrees(carto.longitude),
        lat: CesiumMath.toDegrees(carto.latitude),
        height: carto.height,
    };
};

/**
 * Resolve the exact ground point under a window pixel. Prefers
 * `scene.pickPosition` (one-shot, hits the rendered tileset surface via the
 * depth buffer — exact for spawning at the viewport center) and falls back to an
 * ellipsoid intersection when depth picking is unavailable or the pixel misses
 * geometry (e.g. points at the sky). Returns `null` if neither resolves.
 */
export const pickGroundPoint = (scene: Scene, windowPosition: Cartesian2): GeoPoint | null => {
    let cartesian: Cartesian3 | undefined;

    if (scene.pickPositionSupported) {
        cartesian = scene.pickPosition(windowPosition);
    }
    if (!cartesian) {
        cartesian = scene.camera.pickEllipsoid(windowPosition, Ellipsoid.WGS84) ?? undefined;
    }

    return cartesian ? cartesianToGeo(cartesian) : null;
};

/**
 * Sample the real surface height at a lng/lat using the most detailed tiles,
 * loading them if needed. Used to re-ground an object to the surface (e.g. after
 * a translate drag). Resolves to `undefined` when no surface is found.
 */
export const sampleSurfaceHeight = async (scene: Scene, lng: number, lat: number): Promise<number | undefined> => {
    const carto = Cartographic.fromDegrees(lng, lat);
    const [sampled] = await scene.sampleHeightMostDetailed([carto]);
    return sampled?.height;
};
