/**
 * Snaps a raw meters-per-segment value to the *closest* value on the 1-2-5 ladder
 * (…, 1, 2, 5, 10, 20, 50, 100, 200, …) rather than the largest one below it —
 * the track width is fixed now, so the step is chosen for comfortable tick
 * spacing, not to fit a cap. `0` for non-positive / non-finite input.
 */
export const nearestNiceStep = (rawMetersPerStep: number): number => {
    if (!(rawMetersPerStep > 0) || !Number.isFinite(rawMetersPerStep)) return 0;

    const magnitude = 10 ** Math.floor(Math.log10(rawMetersPerStep));
    // `10` closes the ladder: a raw value of 8·magnitude is nearer the next decade.
    const candidates = [1, 2, 5, 10].map((multiplier) => {
        return multiplier * magnitude;
    });

    return candidates.reduce((best, candidate) => {
        return Math.abs(candidate - rawMetersPerStep) < Math.abs(best - rawMetersPerStep) ? candidate : best;
    });
};
