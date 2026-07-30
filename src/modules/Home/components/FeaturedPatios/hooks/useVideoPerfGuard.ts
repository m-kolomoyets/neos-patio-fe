import { useEffect, useRef, useState } from 'react';

type Params = {
    /** Run the sampler only while videos are actually mounted *and* scrubbing. */
    enabled: boolean;
    /** Returns one mounted video to read decode/compositing stats from, or null if none. */
    getSampleVideo?: () => HTMLVideoElement | null;
};

type Result = {
    /** Latches true once the device provably misses its budget. Never flips back within a session. */
    degraded: boolean;
};

// 45fps floor: a main-thread frame slower than this is over budget.
const FRAME_BUDGET_MS = 1000 / 45;
// ~1s of frames per verdict. Windows are disjoint, not rolling: a rolling window re-judges on every
// frame, so one spike gets WINDOW_SIZE chances to trip the guard instead of one.
const WINDOW_SIZE = 60;
// Frames discarded at the start of every sampling session. Sampling begins the moment the carousel
// first moves, which on a cold load overlaps the blob fetches, first video decodes, image decodes
// and React mount — the frames least representative of steady-state performance.
const WARMUP_FRAMES = 45;
// Grace period after the document finishes loading before the guard may sample at all. Together with
// WARMUP_FRAMES this is what makes the verdict repeatable across reloads.
const READY_GRACE_MS = 1500;
// Deltas above this are a backgrounded tab / device sleep, not jank — drop them.
const OUTLIER_DELTA_MS = 1000;
// p90, not median: scrub jank is bursty, so a median needs >50% of frames to breach at once and
// almost never trips even when the carousel visibly stutters.
const FRAME_PERCENTILE = 0.9;
// Consecutive breaching windows required to latch. One bad second is a hiccup — three in a row is
// the device. This is the difference between a coin-flip verdict and a stable one.
const REQUIRED_CONSECUTIVE_BREACHES = 3;
// Share of decoded frames the GPU / decoder may drop before the video path counts as too slow.
const DROPPED_FRAME_RATIO_LIMIT = 0.2;
// Ignore the dropped-frame ratio until enough frames were decoded for it to mean anything.
const MIN_DECODED_FRAMES = 60;
// Per-tab-session memo so reloads agree with each other instead of re-rolling the verdict. Only a
// confirmed degrade is ever written; sessionStorage (not localStorage) so a new tab re-measures.
const STORAGE_KEY = 'featured-patios:video-perf-degraded:v1';

type VideoWithQuality = HTMLVideoElement & {
    getVideoPlaybackQuality?: () => { totalVideoFrames: number; droppedVideoFrames: number };
    webkitDecodedFrameCount?: number;
    webkitDroppedFrameCount?: number;
};

type FrameCounts = { total: number; dropped: number };

const readStoredDegrade = (): boolean => {
    if (typeof sessionStorage === 'undefined') return false;
    try {
        return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
        return false;
    }
};

const storeDegrade = (): void => {
    if (typeof sessionStorage === 'undefined') return;
    try {
        sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
        /* private mode / quota — the in-memory latch still holds for this page view */
    }
};

/**
 * Decoded/dropped frame counters for a video, across the standard API and the WebKit prefixes.
 * Returns null when neither is exposed, so the guard falls back to main-thread sampling alone.
 */
const readFrameCounts = (video: HTMLVideoElement | null): FrameCounts | null => {
    if (!video) return null;
    const el = video as VideoWithQuality;
    if (typeof el.getVideoPlaybackQuality === 'function') {
        const quality = el.getVideoPlaybackQuality();
        return { total: quality.totalVideoFrames, dropped: quality.droppedVideoFrames };
    }
    if (typeof el.webkitDecodedFrameCount === 'number' && typeof el.webkitDroppedFrameCount === 'number') {
        return { total: el.webkitDecodedFrameCount, dropped: el.webkitDroppedFrameCount };
    }
    return null;
};

const percentile = (values: readonly number[], p: number): number => {
    const sorted = [...values].sort((a, b) => {
        return a - b;
    });
    const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
    return sorted[index];
};

/**
 * Runtime performance guard for the featured-carousel videos. Latches `degraded` on either of two
 * independent signals, because they fail in different places:
 *
 *  - main thread: rAF frame deltas, verdict on the p90 of a full window vs the frame budget;
 *  - video pipeline: dropped-vs-decoded frame ratio from the video element itself. Decode and
 *    compositing run off the main thread, so a weak GPU drops frames while rAF stays a clean 16ms —
 *    main-thread sampling alone is blind to exactly the devices this is meant to catch.
 *
 * The verdict is built to be *repeatable*: measuring only after the document settles, discarding a
 * warm-up run, judging disjoint windows, and requiring several consecutive breaches. A guard that
 * can trip on load-time noise gives a different answer on every reload, which reads as a bug —
 * capable device, no videos.
 *
 * Seeded separately by isWeakDevice() at the call site; this is the measured source of truth.
 */
export const useVideoPerfGuard = ({ enabled, getSampleVideo }: Params): Result => {
    const [degraded, setDegraded] = useState<boolean>(readStoredDegrade);
    const [pageSettled, setPageSettled] = useState(false);
    // Survives sampling sessions: scrub bursts are short, so a per-session counter would reset
    // before it could ever reach the confirmation threshold.
    const breachStreakRef = useRef(0);

    useEffect(function waitForPageToSettle() {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        let timeoutId = 0;
        const arm = () => {
            timeoutId = window.setTimeout(() => {
                setPageSettled(true);
            }, READY_GRACE_MS);
        };

        if (document.readyState === 'complete') {
            arm();
            return () => {
                window.clearTimeout(timeoutId);
            };
        }

        window.addEventListener('load', arm, { once: true });
        return () => {
            window.removeEventListener('load', arm);
            window.clearTimeout(timeoutId);
        };
    }, []);

    useEffect(
        function sampleFramePerformance() {
            if (!enabled || !pageSettled || degraded) return;
            if (typeof window === 'undefined' || typeof performance === 'undefined') return;

            const frames: number[] = [];
            let warmupLeft = WARMUP_FRAMES;
            let prev = performance.now();
            let rafId = 0;
            // Counters are cumulative for the element's lifetime, so baseline them: frames dropped
            // before this window (or on a since-detached element) are not ours to judge.
            let sampleVideo: HTMLVideoElement | null = null;
            let baseline: FrameCounts | null = null;

            const resolveSampleVideo = (): HTMLVideoElement | null => {
                // Stay pinned to one element while it lives: re-picking each read would compare
                // counters across elements and produce a different verdict per reload.
                if (sampleVideo?.isConnected) return sampleVideo;
                sampleVideo = getSampleVideo?.() ?? null;
                baseline = null;
                return sampleVideo;
            };

            const videoPipelineDegraded = (): boolean => {
                const video = resolveSampleVideo();
                // Seeks legitimately discard decoded frames; only steady state is evidence.
                if (!video || video.seeking) return false;
                const counts = readFrameCounts(video);
                if (!counts) return false;
                if (!baseline || counts.total < baseline.total) {
                    baseline = counts;
                    return false;
                }
                const total = counts.total - baseline.total;
                if (total < MIN_DECODED_FRAMES) return false;
                const dropped = Math.max(0, counts.dropped - baseline.dropped);
                return dropped / total > DROPPED_FRAME_RATIO_LIMIT;
            };

            const evaluateWindow = (): boolean => {
                const breached = percentile(frames, FRAME_PERCENTILE) > FRAME_BUDGET_MS || videoPipelineDegraded();
                // Disjoint windows: every verdict gets its own frames.
                frames.length = 0;
                if (!breached) {
                    breachStreakRef.current = 0;
                    return false;
                }
                breachStreakRef.current += 1;
                return breachStreakRef.current >= REQUIRED_CONSECUTIVE_BREACHES;
            };

            const tick = () => {
                const now = performance.now();
                const delta = now - prev;
                prev = now;

                // Skip while hidden or on obvious outliers so a background tab can't false-trip the guard.
                if (!document.hidden && delta > 0 && delta < OUTLIER_DELTA_MS) {
                    if (warmupLeft > 0) {
                        warmupLeft -= 1;
                    } else {
                        frames.push(delta);
                        if (frames.length >= WINDOW_SIZE && evaluateWindow()) {
                            setDegraded(true);
                            storeDegrade();
                            return;
                        }
                    }
                }

                rafId = requestAnimationFrame(tick);
            };

            rafId = requestAnimationFrame(tick);
            return () => {
                cancelAnimationFrame(rafId);
            };
        },
        [enabled, pageSettled, degraded, getSampleVideo]
    );

    return { degraded };
};
