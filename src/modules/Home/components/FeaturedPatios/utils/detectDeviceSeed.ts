// Static, cheap device-power seed used to skip video scrubbing on obviously weak hardware
// before any frames are measured. Runtime sampling (useVideoPerfGuard) is the source of truth; this
// only culls the clearly-underpowered up front so they never mount a video at all.

// 4 cores or fewer: low-end phones, tablets and older ultrabooks. The previous <= 2 threshold was
// effectively dead — no shipping device reports that — so nothing was ever culled up front.
const WEAK_CORE_THRESHOLD = 4;
// deviceMemory is bucketed and capped at 8 by the spec; <= 4GB covers the low-memory tier. Matters
// here because the card fetches each video into a blob, so several full videos sit in RAM at once.
const LOW_MEMORY_THRESHOLD_GB = 4;

type NavigatorWithDeviceMemory = Navigator & { deviceMemory?: number };

/**
 * True when the device reports a low logical-core count. `hardwareConcurrency` is absent on some
 * browsers — treat absence as "unknown, not weak" and let runtime sampling decide.
 */
const isWeakCpu = (): boolean => {
    if (typeof navigator === 'undefined') return false;
    const cores = navigator.hardwareConcurrency;
    if (typeof cores !== 'number' || cores <= 0) return false;
    return cores <= WEAK_CORE_THRESHOLD;
};

/**
 * True when the device reports low RAM. `deviceMemory` is Chromium-only — absence is "unknown".
 */
const isLowMemoryDevice = (): boolean => {
    if (typeof navigator === 'undefined') return false;
    const memory = (navigator as NavigatorWithDeviceMemory).deviceMemory;
    if (typeof memory !== 'number' || memory <= 0) return false;
    return memory <= LOW_MEMORY_THRESHOLD_GB;
};

/** Either signal being weak is enough to cull: both are cheap proxies for the same "too slow". */
export const isWeakDevice = (): boolean => {
    return isWeakCpu() || isLowMemoryDevice();
};
