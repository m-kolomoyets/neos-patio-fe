import type { Feature, FeatureCollection, Point as GeoPoint } from 'geojson';

/** A point in screen-pixel space. */
export type Point = {
    x: number;
    y: number;
};

/** A rotated square in screen-pixel space: center, side length, azimuth. */
export type SquareRect = {
    center: Point;
    size: number;
    azimuthDeg: number;
};

/**
 * Per-patio footprint properties. Stored on Point features (not Polygons) so a
 * future slice can flip on native Mapbox clustering without reshaping the data.
 */
export type PatioProperties = {
    /** Side length of the patio footprint, in meters. */
    sizeMeters: number;
    /** Azimuth in degrees, clockwise from north. */
    azimuthDeg: number;
};

export type PatioFeature = Feature<GeoPoint, PatioProperties>;
export type PatioCollection = FeatureCollection<GeoPoint, PatioProperties>;
