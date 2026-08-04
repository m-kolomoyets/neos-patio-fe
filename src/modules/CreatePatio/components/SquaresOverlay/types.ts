import type { CSSProperties } from 'react';

/**
 * Overlay-level custom properties: the cross-fade opacity the driver rewrites each
 * frame, and the resting scale of the accent sheen (constant across types, so it is
 * declared once here and inherited by every square).
 */
export type OverlayVars = CSSProperties & {
    '--crossfade-opacity': string;
    '--indicator-sheen-rest': string;
};

/**
 * Per-square paint read by `styles.module.css`: the pressed/selected ring color and
 * the two inner-glow filters (with the white highlights for default/hovered,
 * without them once selected — the accent ring takes over there).
 */
export type IndicatorVars = CSSProperties & {
    '--indicator-pressed-border': string;
    '--indicator-inset': string;
    '--indicator-inset-pressed': string;
};

export type InnerShadowProps = {
    color: string;
    /** CSS blur radius; halved for the filter's `stdDeviation`. */
    blur: number;
    dx?: number;
    dy?: number;
    /** CSS shadow spread; negative narrows the band, as in `box-shadow`. */
    spread?: number;
    /** Filter-local result name this chain publishes. */
    result: string;
};
