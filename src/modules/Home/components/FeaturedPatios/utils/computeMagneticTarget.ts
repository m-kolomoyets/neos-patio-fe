type Point = {
    x: number;
    y: number;
};

type Params = {
    cursorX: number;
    cursorY: number;
    prevCenter: Point;
    nextCenter: Point;
    radius: number;
    maxRate: number;
};

const contribution = (cursorX: number, cursorY: number, center: Point, radius: number, maxRate: number): number => {
    if (radius <= 0) return 0;
    const dx = cursorX - center.x;
    const dy = cursorY - center.y;
    const distance = Math.hypot(dx, dy);
    const t = Math.max(0, Math.min(1, 1 - distance / radius));
    return t * t * maxRate;
};

/**
 * Signed target scrub velocity (fraction of video duration per second) for the magnetic field.
 * Next button pulls positive (forward), prev button negative (backward); overlapping fields net-sum.
 */
export const computeMagneticTarget = ({
    cursorX,
    cursorY,
    prevCenter,
    nextCenter,
    radius,
    maxRate,
}: Params): number => {
    const next = contribution(cursorX, cursorY, nextCenter, radius, maxRate);
    const prev = contribution(cursorX, cursorY, prevCenter, radius, maxRate);
    return next - prev;
};
