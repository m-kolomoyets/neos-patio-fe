'use no memo';

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
    /**
     * Output mode. `'clip'` emits a `clip-path` (aliased edges in Blink);
     * `'mask'` emits an alpha `mask-image` of the same outline, which the GPU
     * anti-aliases for smooth corners. Defaults to `'clip'`.
     */
    as?: 'clip' | 'mask';
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
    as = 'clip',
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

        if (as === 'mask') {
            const svg =
                `<svg xmlns='http://www.w3.org/2000/svg' ` +
                `width='${measures.width}' height='${measures.height}' ` +
                `viewBox='0 0 ${measures.width} ${measures.height}'>` +
                `<path d='${path}' fill='white'/></svg>`;
            const value = `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0 / 100% 100% no-repeat`;

            return { WebkitMask: value, mask: value };
        }

        return { clipPath: `path("${path}")` };
    }, [measures?.width, measures?.height, cornerRadius, cornerSmoothing, preserveSmoothing, as]);

    return [ref, style];
}
