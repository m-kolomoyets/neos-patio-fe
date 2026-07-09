/** Circumference-derived Web Mercator ground resolution at zoom 0, latitude 0. */
const EQUATOR_METERS_PER_PIXEL_AT_Z0 = 156543.03392;

/**
 * Converts a ground distance in meters to screen pixels for a top-down Web
 * Mercator map at the given latitude and zoom. Pure — no map access.
 *
 * Resolution (meters per pixel) shrinks as you zoom in and as latitude moves
 * away from the equator, so a fixed 100m square grows on screen when zooming in.
 */
export const metersToPixels = (meters: number, latitude: number, zoom: number): number => {
    const latitudeRad = (latitude * Math.PI) / 180;
    const metersPerPixel = (EQUATOR_METERS_PER_PIXEL_AT_Z0 * Math.cos(latitudeRad)) / 2 ** zoom;

    return meters / metersPerPixel;
};
