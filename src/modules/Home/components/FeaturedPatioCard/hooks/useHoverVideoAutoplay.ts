import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_X_PX = 24;
const MAX_Y_PX = 24;
const HOVER_LERP = 0.15;
const LEAVE_DURATION_MS = 250;
const POS_EPSILON = 0.5;

type Phase = 'idle' | 'loading' | 'active' | 'rewinding' | 'broken';

type Params = {
    videoUrl: string | undefined;
    shouldPrefetch: boolean;
};

type Result = {
    rootRef: React.RefCallback<HTMLElement>;
    stackRef: React.RefCallback<HTMLDivElement>;
    videoRef: React.RefCallback<HTMLVideoElement>;
    shouldMountVideo: boolean;
    videoSrc: string | undefined;
    phase: Phase;
    onPointerEnter: (_e: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (_e: React.PointerEvent<HTMLElement>) => void;
    onPointerLeave: (_e: React.PointerEvent<HTMLElement>) => void;
    onVideoLoadedMetadata: () => void;
    onVideoError: () => void;
};

const easeOutCubic = (t: number) => {
    return 1 - Math.pow(1 - t, 3);
};

const supportsHover = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: hover)').matches;
};

const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const useHoverVideoAutoplay = ({ videoUrl, shouldPrefetch }: Params): Result => {
    const [capable] = useState<boolean>(() => {
        return supportsHover() && !prefersReducedMotion();
    });
    const enabled = capable && Boolean(videoUrl);
    const [shouldMountVideo, setShouldMountVideo] = useState(false);
    const [phase, setPhase] = useState<Phase>('idle');

    const rootElRef = useRef<HTMLElement | null>(null);
    const stackElRef = useRef<HTMLDivElement | null>(null);
    const videoElRef = useRef<HTMLVideoElement | null>(null);

    const targetXRef = useRef(0);
    const targetYRef = useRef(0);
    const currentXRef = useRef(0);
    const currentYRef = useRef(0);
    const metadataReadyRef = useRef(false);
    const hoveredRef = useRef(false);
    const rafIdRef = useRef<number | null>(null);
    const leaveStartRef = useRef<number | null>(null);
    const leaveFromXRef = useRef(0);
    const leaveFromYRef = useRef(0);
    const phaseRef = useRef<Phase>('idle');

    const setPhaseBoth = useCallback((p: Phase) => {
        phaseRef.current = p;
        setPhase(p);
    }, []);

    if (enabled && shouldPrefetch && !shouldMountVideo) {
        setShouldMountVideo(true);
    }

    const writeStack = useCallback((x: number, y: number) => {
        const el = stackElRef.current;
        if (!el) return;
        el.style.setProperty('--tx', x.toFixed(2));
        el.style.setProperty('--ty', y.toFixed(2));
    }, []);

    const stopRaf = useCallback(() => {
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
    }, []);

    const scheduleHover = useCallback(() => {
        const tick = () => {
            rafIdRef.current = null;
            const tx = targetXRef.current * MAX_X_PX;
            const ty = targetYRef.current * MAX_Y_PX;

            currentXRef.current += (tx - currentXRef.current) * HOVER_LERP;
            currentYRef.current += (ty - currentYRef.current) * HOVER_LERP;
            if (Math.abs(tx - currentXRef.current) < POS_EPSILON) currentXRef.current = tx;
            if (Math.abs(ty - currentYRef.current) < POS_EPSILON) currentYRef.current = ty;
            writeStack(currentXRef.current, currentYRef.current);

            if (hoveredRef.current && phaseRef.current !== 'broken') {
                rafIdRef.current = requestAnimationFrame(tick);
            }
        };
        if (rafIdRef.current === null) rafIdRef.current = requestAnimationFrame(tick);
    }, [writeStack]);

    const scheduleLeave = useCallback(() => {
        const tick = () => {
            rafIdRef.current = null;
            const start = leaveStartRef.current;
            if (start === null) return;
            const elapsed = performance.now() - start;
            const t = Math.min(1, elapsed / LEAVE_DURATION_MS);
            const eased = easeOutCubic(t);

            const x = leaveFromXRef.current * (1 - eased);
            const y = leaveFromYRef.current * (1 - eased);
            currentXRef.current = x;
            currentYRef.current = y;
            writeStack(x, y);

            if (t < 1) {
                rafIdRef.current = requestAnimationFrame(tick);
            } else {
                leaveStartRef.current = null;
                setPhaseBoth('idle');
            }
        };
        rafIdRef.current = requestAnimationFrame(tick);
    }, [setPhaseBoth, writeStack]);

    const seedFromEvent = useCallback((e: React.PointerEvent<HTMLElement>) => {
        const root = rootElRef.current;
        if (!root) return;
        const rect = root.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        targetXRef.current = Math.max(-1, Math.min(1, x * 2 - 1));
        targetYRef.current = Math.max(-1, Math.min(1, y * 2 - 1));
    }, []);

    const tryPlay = useCallback(() => {
        const video = videoElRef.current;
        if (!video) return;
        const promise = video.play();
        if (promise && typeof promise.catch === 'function') {
            promise.catch(() => {
                /* ignore */
            });
        }
    }, []);

    const onPointerEnter = useCallback(
        (e: React.PointerEvent<HTMLElement>) => {
            if (!enabled || e.pointerType !== 'mouse') return;
            hoveredRef.current = true;
            leaveStartRef.current = null;
            stopRaf();
            seedFromEvent(e);
            if (!shouldMountVideo) setShouldMountVideo(true);
            if (phaseRef.current === 'broken') return;
            if (metadataReadyRef.current) {
                setPhaseBoth('active');
                tryPlay();
            } else {
                setPhaseBoth('loading');
            }
            scheduleHover();
        },
        [enabled, scheduleHover, seedFromEvent, setPhaseBoth, shouldMountVideo, stopRaf, tryPlay]
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLElement>) => {
            if (!enabled || e.pointerType !== 'mouse') return;
            seedFromEvent(e);
            if (hoveredRef.current && rafIdRef.current === null && phaseRef.current !== 'broken') {
                scheduleHover();
            }
        },
        [enabled, scheduleHover, seedFromEvent]
    );

    const onPointerLeave = useCallback(
        (e: React.PointerEvent<HTMLElement>) => {
            if (!enabled || e.pointerType !== 'mouse') return;
            hoveredRef.current = false;
            stopRaf();
            const video = videoElRef.current;
            if (video) {
                if (!video.paused) video.pause();
                try {
                    video.currentTime = 0;
                } catch {
                    /* ignore */
                }
            }
            if (phaseRef.current === 'broken') return;
            leaveFromXRef.current = currentXRef.current;
            leaveFromYRef.current = currentYRef.current;
            leaveStartRef.current = performance.now();
            setPhaseBoth('rewinding');
            scheduleLeave();
        },
        [enabled, scheduleLeave, setPhaseBoth, stopRaf]
    );

    const onVideoLoadedMetadata = useCallback(() => {
        metadataReadyRef.current = true;
        if (hoveredRef.current && phaseRef.current === 'loading') {
            setPhaseBoth('active');
            tryPlay();
        }
    }, [setPhaseBoth, tryPlay]);

    const onVideoError = useCallback(() => {
        metadataReadyRef.current = false;
        setPhaseBoth('broken');
        stopRaf();
    }, [setPhaseBoth, stopRaf]);

    useEffect(() => {
        return () => {
            if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    const rootRef = useCallback((el: HTMLElement | null) => {
        rootElRef.current = el;
    }, []);
    const stackRef = useCallback((el: HTMLDivElement | null) => {
        stackElRef.current = el;
    }, []);
    const videoRef = useCallback((el: HTMLVideoElement | null) => {
        videoElRef.current = el;
        if (!el) {
            metadataReadyRef.current = false;
        }
    }, []);

    return {
        rootRef,
        stackRef,
        videoRef,
        shouldMountVideo: enabled && shouldMountVideo,
        videoSrc: videoUrl,
        phase,
        onPointerEnter,
        onPointerMove,
        onPointerLeave,
        onVideoLoadedMetadata,
        onVideoError,
    };
};
