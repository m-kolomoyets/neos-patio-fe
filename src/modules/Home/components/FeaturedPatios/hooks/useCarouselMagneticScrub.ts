import type { EmblaCarouselType } from 'embla-carousel';
import { useEffect } from 'react';
import { computeMagneticTarget } from '../utils/computeMagneticTarget';

type Params = {
    emblaApi: EmblaCarouselType | undefined;
    prevRef: React.RefObject<HTMLElement | null>;
    nextRef: React.RefObject<HTMLElement | null>;
    enabled: boolean;
};

const RADIUS_PX = 225;
// Max scrub offset as a fraction of video duration at full proximity (cursor on a button).
const MAX_OFFSET = 0.6;
const LERP_K = 0.15;
const OFFSET_EPSILON = 1e-4;
const SEEK_MIN_DELTA_SEC = 0.01;
const MAX_SCRUBBING_VIDEOS = 3;

type Center = { x: number; y: number };

const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
};

export const useCarouselMagneticScrub = ({ emblaApi, prevRef, nextRef, enabled }: Params): void => {
    useEffect(() => {
        if (!emblaApi || !enabled) return;

        let prevCenter: Center = { x: 0, y: 0 };
        let nextCenter: Center = { x: 0, y: 0 };
        let cursorX = 0;
        let cursorY = 0;
        let target = 0;
        let offset = 0;
        let rafId: number | null = null;
        let isScrolling = false;

        const refreshCenters = () => {
            const prevEl = prevRef.current;
            const nextEl = nextRef.current;
            if (prevEl) {
                const r = prevEl.getBoundingClientRect();
                prevCenter = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
            }
            if (nextEl) {
                const r = nextEl.getBoundingClientRect();
                nextCenter = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
            }
        };

        const collectScrubTargets = (): HTMLVideoElement[] => {
            const inView = emblaApi.slidesInView();
            if (inView.length === 0) return [];
            const nodes = emblaApi.slideNodes();
            const videos: HTMLVideoElement[] = [];
            for (const idx of inView) {
                if (videos.length >= MAX_SCRUBBING_VIDEOS) break;
                const node = nodes[idx];
                if (!node) continue;
                const card = node.querySelector<HTMLElement>('[data-card-id]');
                if (card?.getAttribute('data-phase') !== 'idle') continue;
                const video = node.querySelector<HTMLVideoElement>('video');
                if (!video) continue;
                videos.push(video);
            }
            return videos;
        };

        const baselineOf = (video: HTMLVideoElement): number => {
            const parsed = video.dataset.scrubTime !== undefined ? Number.parseFloat(video.dataset.scrubTime) : NaN;
            return Number.isFinite(parsed) ? parsed : 0;
        };

        const tick = () => {
            rafId = null;

            // Ease the proximity offset toward its target; this single lerp gives both the
            // smooth ramp on entry and the ease-back to baseline on exit (target -> 0).
            offset += (target - offset) * LERP_K;
            if (Math.abs(target - offset) < OFFSET_EPSILON) offset = target;

            // While the carousel animates, yield currentTime ownership to the scroll scrub.
            if (!isScrolling) {
                for (const video of collectScrubTargets()) {
                    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.seeking) continue;
                    if (!video.paused) video.pause();
                    const desired = clamp(baselineOf(video) + offset * video.duration, 0, video.duration);
                    // Lerp the frame toward target rather than snapping, so handoff from the
                    // card's hover scrub (which leaves currentTime at baseline) eases in.
                    const next = video.currentTime + (desired - video.currentTime) * LERP_K;
                    if (Math.abs(next - video.currentTime) < SEEK_MIN_DELTA_SEC) continue;
                    try {
                        video.currentTime = next;
                    } catch {
                        /* ignore */
                    }
                }
            }

            if (target !== 0 || Math.abs(offset) > OFFSET_EPSILON) {
                rafId = requestAnimationFrame(tick);
            } else {
                offset = 0;
            }
        };

        const ensureRunning = () => {
            if (rafId === null) rafId = requestAnimationFrame(tick);
        };

        const recomputeTarget = () => {
            target = computeMagneticTarget({
                cursorX,
                cursorY,
                prevCenter,
                nextCenter,
                radius: RADIUS_PX,
                maxRate: MAX_OFFSET,
            });
            if (target !== 0) ensureRunning();
        };

        const onPointerMove = (e: PointerEvent) => {
            cursorX = e.clientX;
            cursorY = e.clientY;
            recomputeTarget();
        };

        const onResize = () => {
            refreshCenters();
            recomputeTarget();
        };

        const onMotionStart = () => {
            isScrolling = true;
        };
        const onSettle = () => {
            isScrolling = false;
        };

        refreshCenters();
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('resize', onResize);
        emblaApi.on('reInit', onResize);
        emblaApi.on('pointerDown', onMotionStart);
        emblaApi.on('scroll', onMotionStart);
        emblaApi.on('settle', onSettle);

        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('resize', onResize);
            emblaApi.off('reInit', onResize);
            emblaApi.off('pointerDown', onMotionStart);
            emblaApi.off('scroll', onMotionStart);
            emblaApi.off('settle', onSettle);
            if (rafId !== null) cancelAnimationFrame(rafId);
        };
    }, [emblaApi, enabled, prevRef, nextRef]);
};
