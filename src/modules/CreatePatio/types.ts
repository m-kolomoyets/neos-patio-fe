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

/**
 * Design-system `Indicator` type (Figma 9081:1180). The four patio types are the
 * published × owned-by-connected-wallet matrix; `target` is the create-mode center
 * cursor. Figma spells the variants "publeshed" — normalized here.
 */
export type IndicatorType = 'owned' | 'not-published' | 'owned-and-published' | 'owned-and-not-published' | 'target';

/**
 * Interaction state of an indicator. There is no `selected` variant in the design
 * system, so selection reuses `pressed` (sticky). Precedence, resolved by
 * `useSquareStates`: selected > pressed > hovered > default.
 */
export type IndicatorState = 'default' | 'hovered' | 'pressed';

/** One indicator type's paint: radial fill edge, inner glow, pressed/selected ring. */
export type IndicatorPaletteEntry = {
    gradientEdge: string;
    gradientOpacity: number;
    insetShadow: string;
    pressedBorder: string;
    /** Same accent pre-multiplied for the DOM badges, which fill with plain CSS gradients. */
    badgeFill: string;
};

/** A rotated square in screen-pixel space: center, side length, azimuth. */
export type SquareRect = {
    center: Point;
    size: number;
    azimuthDeg: number;
};
