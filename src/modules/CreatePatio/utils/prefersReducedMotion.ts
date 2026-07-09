/**
 * Single persistent `MediaQueryList` for the reduced-motion query. Created once
 * (not per call) so the per-frame morph/crossfade drivers can read `.matches`
 * every frame without allocating a fresh list each time. `.matches` still tracks
 * live setting changes, so the "honor a live change" behavior is preserved.
 * `null` in non-DOM environments.
 */
const reducedMotionQuery =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

/**
 * True when the user has requested reduced motion. Reads `.matches` off a shared
 * `MediaQueryList`, so it stays live but allocates nothing per call — safe to
 * call per marker per frame.
 *
 * The single reduced-motion check for the whole create-patio map: camera
 * flights (cluster expand, zoom-in bridge), the square↔circle morph, and the
 * globe atmosphere shimmer all gate off this.
 */
export const prefersReducedMotion = (): boolean => {
    return reducedMotionQuery?.matches ?? false;
};
