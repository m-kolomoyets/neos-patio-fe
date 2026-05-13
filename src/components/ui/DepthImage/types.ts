import type { ImgHTMLAttributes, ReactNode } from 'react';

export type DepthImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
    /**
     * Source URL of a JPG with embedded GDepth XMP metadata
     * (e.g. exported from https://depthy.stamina.pl).
     * Remote sources must serve permissive CORS headers.
     */
    src: string;
    /**
     * Max UV-space offset applied at full cursor deflection.
     * @default 0.025
     */
    strength?: number;
    /**
     * Depth value treated as the pivot plane (no displacement).
     * Range [0, 1]. Lower = focus on far, higher = focus on near.
     * @default 0.5
     */
    focus?: number;
    /**
     * Invert depth interpretation. GDepth spec is white=near, black=far.
     * Set true if a source breaks the convention.
     * @default false
     */
    invertDepth?: boolean;
    /**
     * Replacement node rendered when WebGL is unavailable, the source
     * lacks GDepth, parsing fails, or the user prefers reduced motion.
     * Defaults to a plain `<img>` with the same `src` and `alt`.
     */
    fallback?: ReactNode;
    /**
     * Optional external element to bind pointer events and visibility tracking to.
     * When provided, parallax responds to cursor movement across this element
     * (normalized to its bounding rect) instead of the internal wrap.
     * Canvas sizing and rendering stay scoped to the internal wrap.
     */
    interactionEl?: HTMLElement | null;
};

export type ParsedGDepth = {
    color: ImageBitmap;
    depth: ImageBitmap;
    aspect: number;
};
