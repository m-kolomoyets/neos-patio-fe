// Static, cheap device-power seed used to skip video scrubbing on obviously weak hardware
// before any frames are measured. Runtime FPS (useVideoPerfGuard) is the source of truth; this
// only culls the clearly-underpowered up front so they never mount a video at all.

const WEAK_CORE_THRESHOLD = 2;

/**
 * True when the device reports a low logical-core count. `hardwareConcurrency` is absent on some
 * browsers — treat absence as "unknown, not weak" and let runtime FPS decide.
 */
export const isWeakDevice = (): boolean => {
    if (typeof navigator === 'undefined') return false;
    const cores = navigator.hardwareConcurrency;
    if (typeof cores !== 'number' || cores <= 0) return false;
    return cores <= WEAK_CORE_THRESHOLD;
};
