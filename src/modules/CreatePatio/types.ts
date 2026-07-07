/**
 * Base-map appearance. `satellite` — pure aerial imagery, no roads/labels (the
 * satellite raster overlay at full opacity). `aerial` — the light vector street
 * map underneath (raster hidden).
 */
export type MapView = 'satellite' | 'aerial';

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
