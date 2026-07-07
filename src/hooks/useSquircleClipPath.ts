import React from 'react';
import { getSvgPath } from 'figma-squircle';
import { borderBoxMeasurer, useMeasure } from './useMeasure';

type UseSquircleClipPathOptions = {
    /** Corner radius in px. Matches `border-radius`. */
    cornerRadius: number;
    /** iOS-style corner smoothing, 0–1. Figma 60% = `0.6`. */
    cornerSmoothing?: number;
    /** Keep smoothing on small elements where the budget would clamp it. */
    preserveSmoothing?: boolean;
    enabled?: boolean;
};

/**
 * Generates a Figma/iOS squircle `clip-path` for an element, recomputed on resize.
 * `corner-shape: superellipse()` is Chromium-only and doesn't match Figma's smoothing —
 * this clips the true squircle outline instead, cross-browser.
 *
 * @returns `[ref, style]` — spread `style` onto the same element the `ref` is on.
 */
export function useSquircleClipPath<T extends Element>({
    cornerRadius,
    cornerSmoothing = 0.6,
    preserveSmoothing = true,
    enabled = true,
}: UseSquircleClipPathOptions): [React.MutableRefObject<T | null>, React.CSSProperties] {
    const [measures, ref] = useMeasure<T>(enabled, borderBoxMeasurer);

    const style = React.useMemo<React.CSSProperties>(() => {
        if (!measures?.width || !measures?.height) {
            return {};
        }

        const path = getSvgPath({
            width: measures.width,
            height: measures.height,
            cornerRadius,
            cornerSmoothing,
            preserveSmoothing,
        });

        return { clipPath: `path("${path}")` };
    }, [measures?.width, measures?.height, cornerRadius, cornerSmoothing, preserveSmoothing]);

    return [ref, style];
}
