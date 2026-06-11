type Params = {
    cursorX: number;
    areaLeft: number;
    areaWidth: number;
    maxSpeed: number;
};

/**
 * Signed auto-scroll speed (px/frame) for the half-split magnetic field.
 *
 * The carousel area is split in two by its vertical center line. The cursor's horizontal
 * distance from that center, normalized against the half-width, drives a linear ramp:
 * zero at the center, `maxSpeed` at either edge. Positive means scroll forward (next),
 * negative means scroll back (prev).
 */
export const computeHalfScrollSpeed = ({ cursorX, areaLeft, areaWidth, maxSpeed }: Params): number => {
    if (areaWidth <= 0) return 0;
    const halfWidth = areaWidth / 2;
    const centerX = areaLeft + halfWidth;
    const offset = cursorX - centerX;
    const t = Math.max(0, Math.min(1, Math.abs(offset) / halfWidth));
    return Math.sign(offset) * t * maxSpeed;
};
