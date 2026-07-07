import type { Point, SquareRect } from '../types';

/**
 * Given a center point, side length, and azimuth (degrees, clockwise from north),
 * returns the four corners of the rotated square in screen-pixel space. Pure.
 *
 * Corner order is clockwise starting from the top-left of the unrotated square,
 * so callers can build a polygon or path directly. Used by the center square and
 * (later) by each existing patio square.
 */
export const getSquareCorners = (center: Point, size: number, azimuthDeg: number): Point[] => {
    const half = size / 2;
    const azimuthRad = (azimuthDeg * Math.PI) / 180;
    const cos = Math.cos(azimuthRad);
    const sin = Math.sin(azimuthRad);

    // Unrotated corners relative to center, clockwise from top-left.
    const local: Point[] = [
        { x: -half, y: -half },
        { x: half, y: -half },
        { x: half, y: half },
        { x: -half, y: half },
    ];

    return local.map(({ x, y }) => {
        return {
            x: center.x + x * cos - y * sin,
            y: center.y + x * sin + y * cos,
        };
    });
};

/**
 * Point-in-rotated-square hit test in screen-pixel space. Translates the point
 * into the square's local frame (inverse-rotating by its azimuth) and checks it
 * against the axis-aligned half-extent box. Pure — used to click existing patio
 * squares, which are rotated by `worldAzimuth − bearing`.
 */
export const isPointInSquare = (point: Point, rect: SquareRect): boolean => {
    const { center, size, azimuthDeg } = rect;
    const half = size / 2;
    const azimuthRad = (azimuthDeg * Math.PI) / 180;
    const cos = Math.cos(azimuthRad);
    const sin = Math.sin(azimuthRad);

    const dx = point.x - center.x;
    const dy = point.y - center.y;
    // Inverse rotation (by −azimuth) of the forward rotate in getSquareCorners.
    const localX = dx * cos + dy * sin;
    const localY = -dx * sin + dy * cos;

    return Math.abs(localX) <= half && Math.abs(localY) <= half;
};

/**
 * SVG transform that rotates a rect around the given center by the azimuth.
 * Lets a rounded `<rect>` (with `rx`) keep its corner radius under rotation,
 * which a hand-built polygon path could not express as cleanly.
 */
export const getRotateTransform = (center: Point, azimuthDeg: number): string => {
    return `rotate(${azimuthDeg} ${center.x} ${center.y})`;
};

/**
 * SVG `<rect>` attributes for a rotated square: an axis-aligned rect centered on
 * the point plus a rotate transform. Shared by every square (center, patios) and
 * by the clip shapes used for the intersection, so base and clipped rects align
 * pixel-for-pixel.
 */
export const getRectAttrs = (rect: SquareRect) => {
    const { center, size, azimuthDeg } = rect;

    return {
        x: center.x - size / 2,
        y: center.y - size / 2,
        width: size,
        height: size,
        transform: getRotateTransform(center, azimuthDeg),
    };
};
