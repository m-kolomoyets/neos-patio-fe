import { metersToPixels } from './metersToPixels';

/** Zoom-0 ground resolution for Mapbox GL's 512px tile — see {@link metersToPixels}. */
const EQUATOR_METERS_PER_PIXEL_AT_Z0 = 40075016.686 / 512;

/**
 * Inverse of {@link metersToPixels}: the Web Mercator zoom at which `meters`
 * spans `pixels` on screen at the given latitude. Pure — no map access.
 *
 * Round-trips with `metersToPixels`: `metersToPixels(m, lat, zoomForFootprint(m, lat, px)) === px`.
 */
export const zoomForFootprint = (meters: number, latitude: number, pixels: number): number => {
    const latitudeRad = (latitude * Math.PI) / 180;
    const metersPerPixelAtZ0 = EQUATOR_METERS_PER_PIXEL_AT_Z0 * Math.cos(latitudeRad);

    // pixels = meters * 2^zoom / metersPerPixelAtZ0  ⇒  zoom = log2(pixels * metersPerPixelAtZ0 / meters).
    return Math.log2((pixels * metersPerPixelAtZ0) / meters);
};

/** Shorter of the two viewport dimensions, the reference for both zoom ratios. */
export const minViewportDimension = (width: number, height: number): number => {
    return Math.min(width, height);
};

/**
 * True when the 100m footprint (or any `meters` span) fills at least `ratio` of
 * the shorter viewport dimension at the current camera — i.e. zoomed in enough
 * to meaningfully place a patio.
 */
export const isZoomEnough = (
    meters: number,
    latitude: number,
    zoom: number,
    minDimension: number,
    ratio: number
): boolean => {
    return metersToPixels(meters, latitude, zoom) >= ratio * minDimension;
};
