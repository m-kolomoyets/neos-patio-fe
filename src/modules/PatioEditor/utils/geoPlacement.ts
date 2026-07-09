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

/** An east/north/up offset, in meters, from a {@link LocalFrame} origin. */
export type LocalOffset = { x: number; y: number; z: number };

/**
 * An east-north-up frame anchored at a fixed origin, with both directions of the
 * ENU↔ECEF transform precomputed. Built once per patio (the origin is the bounds
 * center) and reused for every geo↔local conversion, so editing never rebuilds
 * the matrices.
 */
export type LocalFrame = {
    /** ENU (meters) → earth-fixed (ECEF). */
    toFixed: Matrix4;
    /** Earth-fixed (ECEF) → ENU (meters). */
    toLocal: Matrix4;
};

/**
 * Build the {@link LocalFrame} whose origin is the center of the patio rectangle
 * `[west, south, east, north]` at ellipsoid height 0. `x`/`y`/`z` produced by
 * {@link geoToLocal} are then east/north/up meters from that center.
 */
export const createLocalFrame = (bounds: PatioBounds): LocalFrame => {
    const [west, south, east, north] = bounds;
    const origin = Cartesian3.fromDegrees((west + east) / 2, (south + north) / 2, 0);
    const toFixed = Transforms.eastNorthUpToFixedFrame(origin);
    const toLocal = Matrix4.inverse(toFixed, new Matrix4());
    return { toFixed, toLocal };
};

/** Convert a geographic point to east/north/up meters within `frame`. */
export const geoToLocal = (frame: LocalFrame, point: GeoPoint): LocalOffset => {
    const ecef = Cartesian3.fromDegrees(point.lng, point.lat, point.height);
    const local = Matrix4.multiplyByPoint(frame.toLocal, ecef, new Cartesian3());
    return { x: local.x, y: local.y, z: local.z };
};

/** Inverse of {@link geoToLocal}: east/north/up meters back to a geographic point. */
export const localToGeo = (frame: LocalFrame, offset: LocalOffset): GeoPoint => {
    const point = new Cartesian3(offset.x, offset.y, offset.z);
    const ecef = Matrix4.multiplyByPoint(frame.toFixed, point, point);
    const carto = Cartographic.fromCartesian(ecef);
    return {
        lng: CesiumMath.toDegrees(carto.longitude),
        lat: CesiumMath.toDegrees(carto.latitude),
        height: carto.height,
    };
};

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

/**
 * Inverse of {@link geoPoseToModelMatrix}: decompose a model matrix back into a
 * geographic + HPR pose. Translation → lng/lat/height, the ENU-relative
 * orientation → heading/pitch/roll, and the (assumed uniform) scale → `scale`.
 * Used to read a gizmo-dragged model's `modelMatrix` back into editor state.
 */
export const modelMatrixToGeoPose = (matrix: Matrix4): GeoPose => {
    const translation = Matrix4.getTranslation(matrix, new Cartesian3());
    const carto = Cartographic.fromCartesian(translation);
    const hpr = Transforms.fixedFrameToHeadingPitchRoll(matrix);
    const scaleVec = Matrix4.getScale(matrix, new Cartesian3());
    return {
        lng: CesiumMath.toDegrees(carto.longitude),
        lat: CesiumMath.toDegrees(carto.latitude),
        height: carto.height,
        heading: hpr.heading,
        pitch: hpr.pitch,
        roll: hpr.roll,
        // Objects carry a single uniform scale; read it off the X axis.
        scale: scaleVec.x,
    };
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
