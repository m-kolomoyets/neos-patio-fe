/**
 * True when the user has requested reduced motion. Read at call time (not
 * cached) so the very next camera move honors a live setting change. Guards
 * `matchMedia` for non-DOM environments.
 *
 * The single reduced-motion check for the whole create-patio map: camera
 * flights (cluster expand, zoom-in bridge), the square↔circle morph, and the
 * globe atmosphere shimmer all gate off this.
 */
export const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
