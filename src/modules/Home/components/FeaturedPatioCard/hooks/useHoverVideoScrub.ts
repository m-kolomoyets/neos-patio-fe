import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_Y_PX = 24;
const HOVER_LERP = 0.15;
const TRANSITION_DURATION_MS = 500;
const TIME_EPSILON = 0.01;
const Y_EPSILON = 0.5;

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

export const useHoverVideoScrub = ({ videoUrl, shouldPrefetch }: Params): Result => {
    const [capable] = useState<boolean>(() => {
        return supportsHover() && !prefersReducedMotion();
    });
    const enabled = capable && Boolean(videoUrl);
    const [shouldMountVideo, setShouldMountVideo] = useState(false);
    const [phase, setPhase] = useState<Phase>('idle');
    const [blobSrc, setBlobSrc] = useState<string | undefined>(undefined);

    const rootElRef = useRef<HTMLElement | null>(null);
    const stackElRef = useRef<HTMLDivElement | null>(null);
    const videoElRef = useRef<HTMLVideoElement | null>(null);

    const targetXRef = useRef(0);
    const targetYRef = useRef(0);
    const currentTimeRef = useRef(0);
    const currentYRef = useRef(0);
    const metadataReadyRef = useRef(false);
    const hoveredRef = useRef(false);
    const rafIdRef = useRef<number | null>(null);
    const leaveStartRef = useRef<number | null>(null);
    const leaveFromTimeRef = useRef(0);
    const leaveFromYRef = useRef(0);
    const enterStartRef = useRef<number | null>(null);
    const enterFromYRef = useRef(0);
    const enterFromTimeRef = useRef(0);
    const phaseRef = useRef<Phase>('idle');

    const setPhaseBoth = useCallback((p: Phase) => {
        phaseRef.current = p;
        setPhase(p);
    }, []);

    if (enabled && shouldPrefetch && !shouldMountVideo) {
        setShouldMountVideo(true);
    }

    const writeStackY = useCallback((y: number) => {
        const el = stackElRef.current;
        if (!el) return;
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
            const video = videoElRef.current;
            const tx = targetXRef.current;
            const ty = targetYRef.current * MAX_Y_PX;

            const enterStart = enterStartRef.current;
            let easedF = 1;
            if (enterStart !== null) {
                const elapsed = performance.now() - enterStart;
                const t = Math.min(1, elapsed / TRANSITION_DURATION_MS);
                easedF = easeOutCubic(t);
                if (t >= 1) enterStartRef.current = null;
            }

            if (enterStart !== null) {
                currentYRef.current = enterFromYRef.current + (ty - enterFromYRef.current) * easedF;
            } else {
                currentYRef.current += (ty - currentYRef.current) * HOVER_LERP;
                if (Math.abs(ty - currentYRef.current) < Y_EPSILON) currentYRef.current = ty;
            }
            writeStackY(currentYRef.current);

            if (video && metadataReadyRef.current && Number.isFinite(video.duration) && video.duration > 0) {
                const targetTime = tx * video.duration;
                if (enterStart !== null) {
                    currentTimeRef.current =
                        enterFromTimeRef.current + (targetTime - enterFromTimeRef.current) * easedF;
                } else {
                    currentTimeRef.current += (targetTime - currentTimeRef.current) * HOVER_LERP;
                    if (Math.abs(targetTime - currentTimeRef.current) < TIME_EPSILON)
                        currentTimeRef.current = targetTime;
                }
                if (!video.seeking) {
                    try {
                        video.currentTime = currentTimeRef.current;
                    } catch {
                        /* ignore */
                    }
                }
            }

            if (hoveredRef.current && phaseRef.current !== 'broken') {
                rafIdRef.current = requestAnimationFrame(tick);
            }
        };
        if (rafIdRef.current === null) rafIdRef.current = requestAnimationFrame(tick);
    }, [writeStackY]);

    const scheduleLeave = useCallback(() => {
        const tick = () => {
            rafIdRef.current = null;
            const start = leaveStartRef.current;
            if (start === null) return;
            const elapsed = performance.now() - start;
            const t = Math.min(1, elapsed / TRANSITION_DURATION_MS);
            const eased = easeOutCubic(t);

            const y = leaveFromYRef.current * (1 - eased);
            currentYRef.current = y;
            writeStackY(y);

            const video = videoElRef.current;
            if (video && metadataReadyRef.current) {
                const time = leaveFromTimeRef.current * (1 - eased);
                currentTimeRef.current = time;
                try {
                    video.currentTime = time;
                } catch {
                    /* ignore */
                }
            }

            if (t < 1) {
                rafIdRef.current = requestAnimationFrame(tick);
            } else {
                leaveStartRef.current = null;
                setPhaseBoth('idle');
            }
        };
        rafIdRef.current = requestAnimationFrame(tick);
    }, [setPhaseBoth, writeStackY]);

    const seedFromEvent = useCallback((e: React.PointerEvent<HTMLElement>) => {
        const root = rootElRef.current;
        if (!root) return;
        const rect = root.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        targetXRef.current = Math.max(0, Math.min(1, x));
        targetYRef.current = Math.max(-1, Math.min(1, y * 2 - 1));
    }, []);

    const onPointerEnter = useCallback(
        (e: React.PointerEvent<HTMLElement>) => {
            if (!enabled || e.pointerType !== 'mouse') return;
            hoveredRef.current = true;
            leaveStartRef.current = null;
            stopRaf();
            seedFromEvent(e);
            enterFromYRef.current = currentYRef.current;
            enterFromTimeRef.current = currentTimeRef.current;
            enterStartRef.current = performance.now();
            if (!shouldMountVideo) setShouldMountVideo(true);
            if (phaseRef.current === 'broken') return;
            if (metadataReadyRef.current) {
                setPhaseBoth('active');
            } else {
                setPhaseBoth('loading');
            }
            scheduleHover();
        },
        [enabled, scheduleHover, seedFromEvent, setPhaseBoth, shouldMountVideo, stopRaf]
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
            enterStartRef.current = null;
            stopRaf();
            if (phaseRef.current === 'broken') return;
            leaveFromTimeRef.current = currentTimeRef.current;
            leaveFromYRef.current = currentYRef.current;
            leaveStartRef.current = performance.now();
            setPhaseBoth('rewinding');
            scheduleLeave();
        },
        [enabled, scheduleLeave, setPhaseBoth, stopRaf]
    );

    const onVideoLoadedMetadata = useCallback(() => {
        metadataReadyRef.current = true;
        const video = videoElRef.current;
        if (video) {
            try {
                video.currentTime = currentTimeRef.current;
            } catch {
                /* ignore */
            }
        }
        if (hoveredRef.current && phaseRef.current === 'loading') {
            setPhaseBoth('active');
        }
    }, [setPhaseBoth]);

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

    useEffect(() => {
        if (!enabled || !videoUrl || !shouldMountVideo) return;
        let cancelled = false;
        let createdUrl: string | undefined;
        fetch(videoUrl)
            .then((r) => {
                if (!r.ok) throw new Error(`status ${r.status}`);
                return r.blob();
            })
            .then((blob) => {
                if (cancelled) return;
                createdUrl = URL.createObjectURL(blob);
                setBlobSrc(createdUrl);
            })
            .catch(() => {
                if (cancelled) return;
                setPhaseBoth('broken');
            });
        return () => {
            cancelled = true;
            if (createdUrl) URL.revokeObjectURL(createdUrl);
        };
    }, [enabled, shouldMountVideo, videoUrl, setPhaseBoth]);

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
        videoSrc: blobSrc,
        phase,
        onPointerEnter,
        onPointerMove,
        onPointerLeave,
        onVideoLoadedMetadata,
        onVideoError,
    };
};
