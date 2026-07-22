/** Map zoom at/above which the scale bar shows. Below it the bar is hidden. */
export const SCALE_BAR_MIN_ZOOM = 15;

/**
 * Fixed on-screen width (px) of the track pill. Never changes — only the ticks
 * move inside it. Must stay in sync with `--scale-bar-track-w` in `styles.module.css`.
 */
export const SCALE_BAR_TRACK_WIDTH_PX = 217;

/** Inset of the baseline from each rounded end of the pill. */
export const SCALE_BAR_TRACK_INSET_PX = 6;

/** Width the ticks actually have to play with, inside the insets. */
export const SCALE_BAR_USABLE_WIDTH_PX = SCALE_BAR_TRACK_WIDTH_PX - SCALE_BAR_TRACK_INSET_PX * 2;

/**
 * Preferred distance between two ticks. The 1-2-5 rung closest to this spacing
 * wins, which keeps the tick count in a comfortable 4-6 gaps and the spacing
 * roughly within 36-72px.
 */
export const SCALE_BAR_TARGET_TICK_SPACING_PX = 50;

/** At/above this step the labels switch to kilometres. */
export const SCALE_BAR_KM_THRESHOLD_M = 1000;

/**
 * Sanity ceiling on meters-per-pixel. Under heavy pitch the bar's screen row can
 * approach the horizon, where `unproject` reports absurd (or infinite) ground
 * distances; past this the bar hides rather than claiming a nonsense scale.
 */
export const SCALE_BAR_MAX_METERS_PER_PIXEL = 5000;
