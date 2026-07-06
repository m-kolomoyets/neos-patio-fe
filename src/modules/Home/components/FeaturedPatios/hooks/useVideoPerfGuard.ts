import { useEffect, useState } from 'react';

type Params = {
    /** Run the sampler only while videos are actually mounted/scrubbing. */
    enabled: boolean;
};

type Result = {
    /** Latches true once sustained frame rate drops below the budget. Never flips back. */
    degraded: boolean;
};

// 30fps floor: a frame slower than this is over budget.
const FRAME_BUDGET_MS = 1000 / 30;
// Rolling window; also the minimum sample before any verdict (answers "30 frames is enough").
const WINDOW_SIZE = 30;
// Deltas above this are a backgrounded tab / device sleep, not jank — drop them.
const OUTLIER_DELTA_MS = 1000;

const median = (values: readonly number[]): number => {
    const sorted = [...values].sort((a, b) => {
        return a - b;
    });
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
    return sorted[mid];
};

/**
 * Runtime frame-rate guard for the featured-carousel videos. Samples rAF frame deltas into a
 * rolling window and latches `degraded` once the median frame time exceeds the 30fps budget.
 *
 * One hook covers both cases the design calls for:
 *  - start calibration: verdict fires as soon as the first WINDOW_SIZE frames are collected;
 *  - later tank: the rolling median keeps being evaluated until it breaches (then latches).
 *
 * Seeded separately by isWeakDevice() at the call site; this is the measured source of truth.
 */
export const useVideoPerfGuard = ({ enabled }: Params): Result => {
    const [degraded, setDegraded] = useState(false);

    useEffect(() => {
        if (!enabled || degraded) return;
        if (typeof window === 'undefined' || typeof performance === 'undefined') return;

        const frames: number[] = [];
        let prev = performance.now();
        let rafId = 0;

        const tick = () => {
            const now = performance.now();
            const delta = now - prev;
            prev = now;

            // Skip while hidden or on obvious outliers so a background tab can't false-trip the guard.
            if (!document.hidden && delta > 0 && delta < OUTLIER_DELTA_MS) {
                frames.push(delta);
                if (frames.length > WINDOW_SIZE) frames.shift();
                if (frames.length >= WINDOW_SIZE && median(frames) > FRAME_BUDGET_MS) {
                    setDegraded(true);
                    return;
                }
            }

            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(rafId);
        };
    }, [enabled, degraded]);

    return { degraded };
};
