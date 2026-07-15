/** The scale bar is always divided into this many equal segments (5 labels: 0…4·step). */
export const SCALE_BAR_SEGMENTS = 4;

/** Map zoom at/above which the scale bar shows. Below it the bar is hidden. */
export const SCALE_BAR_MIN_ZOOM = 15;

/**
 * Max on-screen width (px) of the baseline. The honest-flex algorithm picks the
 * largest 1-2-5 step whose full `SEGMENTS · step` span fits inside this, so the
 * bar never exceeds it and shrinks between rungs. Matches the Figma baseline width.
 */
export const SCALE_BAR_MAX_WIDTH_PX = 217;
