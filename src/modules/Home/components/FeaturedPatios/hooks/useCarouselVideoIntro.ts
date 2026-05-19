import type { EmblaCarouselType } from 'embla-carousel';
import { useEffect } from 'react';
import { ONE_SECOND } from '@/lib/constants';

type Params = {
    emblaApi: EmblaCarouselType | undefined;
    enabled: boolean;
};

const INTRO_OFFSET_SEC = 5;
const INTRO_DURATION_MS = ONE_SECOND;
const SEEK_MIN_INTERVAL_MS = ONE_SECOND / 60;
const SEEK_MIN_DELTA_SEC = 0.05;

const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
};

const seekSmooth = (video: HTMLVideoElement, time: number) => {
    video.currentTime = time;
};

export const useCarouselVideoIntro = ({ emblaApi, enabled }: Params): void => {
    useEffect(() => {
        if (!emblaApi || !enabled) return;

        let rafId: number | null = null;
        let activeVideo: HTMLVideoElement | null = null;

        const stop = () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            activeVideo = null;
        };

        const playIntro = (video: HTMLVideoElement, startTime: number) => {
            stop();
            activeVideo = video;
            const start = performance.now();
            let lastSeekAt = 0;
            let lastSeekTime = Number.NaN;
            try {
                video.pause();
                seekSmooth(video, startTime);
                lastSeekAt = performance.now();
                lastSeekTime = startTime;
            } catch {
                /* ignore */
            }
            const tick = () => {
                rafId = null;
                if (activeVideo !== video) return;
                const now = performance.now();
                const elapsed = now - start;
                const t = Math.min(1, elapsed / INTRO_DURATION_MS);
                const eased = easeOutCubic(t);
                const time = startTime + (0 - startTime) * eased;
                const sinceLast = now - lastSeekAt;
                const delta = Number.isFinite(lastSeekTime) ? Math.abs(time - lastSeekTime) : Infinity;
                if (sinceLast >= SEEK_MIN_INTERVAL_MS && delta >= SEEK_MIN_DELTA_SEC) {
                    try {
                        seekSmooth(video, time);
                        lastSeekAt = now;
                        lastSeekTime = time;
                    } catch {
                        /* ignore */
                    }
                }
                if (t < 1) {
                    rafId = requestAnimationFrame(tick);
                } else {
                    try {
                        seekSmooth(video, 0);
                    } catch {
                        /* ignore */
                    }
                    activeVideo = null;
                }
            };
            rafId = requestAnimationFrame(tick);
        };

        const handleSelect = () => {
            const next = emblaApi.selectedScrollSnap();
            const node = emblaApi.slideNodes()[next];
            if (!node) return;
            const card = node.querySelector<HTMLElement>('[data-card-id]');
            const phase = card?.getAttribute('data-phase');
            if (phase && phase !== 'idle') return;
            const video = node.querySelector<HTMLVideoElement>('video');
            if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

            const offset = Math.min(INTRO_OFFSET_SEC, video.duration);
            const startTime = offset;
            playIntro(video, startTime);
        };

        emblaApi.on('select', handleSelect);
        return () => {
            emblaApi.off('select', handleSelect);
            stop();
        };
    }, [emblaApi, enabled]);
};
