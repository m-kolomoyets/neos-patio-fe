/**
 * Snaps a raw meters-per-segment value down to the nearest "nice" number on the
 * 1-2-5 ladder (…, 1, 2, 5, 10, 20, 50, 100, 200, …). Returns the largest ladder
 * value not exceeding the input, so the resulting bar width stays within its cap.
 * `0` for non-positive / non-finite input (camera not reporting yet).
 */
export const niceStep = (maxMetersPerSegment: number): number => {
    if (!(maxMetersPerSegment > 0) || !Number.isFinite(maxMetersPerSegment)) return 0;

    const magnitude = 10 ** Math.floor(Math.log10(maxMetersPerSegment));
    const fraction = maxMetersPerSegment / magnitude;

    const pickMultiplier = () => {
        if (fraction >= 5) return 5;
        if (fraction >= 2) return 2;

        return 1;
    };

    return pickMultiplier() * magnitude;
};
