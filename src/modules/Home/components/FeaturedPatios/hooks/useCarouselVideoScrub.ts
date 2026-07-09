import type { EmblaCarouselType } from 'embla-carousel';
import { useEffect } from 'react';
import { computeActiveSet } from '../utils/computeActiveSet';

type Params = {
    emblaApi: EmblaCarouselType | undefined;
    enabled: boolean;
};

const NEIGHBOR_RADIUS = 1;
const SEEK_MIN_DELTA_SEC = 0.03;
const SEEK_MIN_INTERVAL_MS = 1000 / 60;
// Amplifies how much of the video scrubs per unit of scroll. 1 = raw (1 - diff)/2 sweep;
// higher = more video covered (more intense parallax) before clamping at the ends.
const SCRUB_GAIN = 2.6;

const clamp01 = (value: number): number => {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
};

export const useCarouselVideoScrub = ({ emblaApi, enabled }: Params): void => {
    useEffect(() => {
        if (!emblaApi || !enabled) return;

        // Snap-space caches. With containScroll: 'trimSnaps' there are fewer snaps than slides,
        // so each slide maps to the snap that carries it (slideRegistry: snapIndex -> slides).
        let snaps: readonly number[] = [];
        const slideToSnap: number[] = [];
        const lastSeekTimes = new Map<number, number>();
        const lastSeekAt = new Map<number, number>();
        let activeSet: ReadonlySet<number> = new Set<number>();

        const refreshCaches = () => {
            snaps = emblaApi.scrollSnapList();
            slideToSnap.length = 0;
            const registry = emblaApi.internalEngine().slideRegistry;
            registry.forEach((slideIndexes, snapIndex) => {
                for (const slideIndex of slideIndexes) {
                    slideToSnap[slideIndex] = snapIndex;
                }
            });
        };

        const rebuildActiveSet = () => {
            const total = emblaApi.slideNodes().length;
            const looped = emblaApi.internalEngine().options.loop === true;
            const inView = emblaApi.slidesInView();
            const next = computeActiveSet(inView, total, NEIGHBOR_RADIUS, looped);
            for (const prevIdx of activeSet) {
                if (!next.has(prevIdx)) {
                    lastSeekTimes.delete(prevIdx);
                    lastSeekAt.delete(prevIdx);
                }
            }
            activeSet = next;
        };

        // Scrub position from how far the carousel scrolled past the slide's snap, not from the
        // slide's on-screen X. diff > 0: snap still ahead (slide entering from the right);
        // diff < 0: snap passed (slide exiting left). (1 - diff) / 2 is a monotonic 0..1 sweep
        // driven by scrollProgress, so edge slides pinned by trimSnaps still scrub their full
        // reachable range instead of freezing near the viewport edge.
        const slideProgress = (slideIndex: number): number => {
            const snapIndex = slideToSnap[slideIndex] ?? 0;
            const snap = snaps[snapIndex] ?? 0;
            const diff = snap - emblaApi.scrollProgress();
            return clamp01(0.5 - diff * 0.5 * SCRUB_GAIN);
        };

        const apply = () => {
            if (activeSet.size === 0) return;
            const nodes = emblaApi.slideNodes();
            for (const idx of activeSet) {
                const node = nodes[idx];
                if (!node) continue;
                const video = node.querySelector<HTMLVideoElement>('video');
                if (!video || !Number.isFinite(video.duration) || video.duration <= 0) continue;
                const card = node.querySelector<HTMLElement>('[data-card-id]');
                const phaseIdle = card?.getAttribute('data-phase') === 'idle';

                const targetTime = slideProgress(idx) * video.duration;
                video.dataset.scrubTime = targetTime.toFixed(3);
                if (!phaseIdle) continue;

                const last = lastSeekTimes.get(idx);
                if (last !== undefined && Math.abs(targetTime - last) < SEEK_MIN_DELTA_SEC) continue;
                const lastAt = lastSeekAt.get(idx) ?? 0;
                const now = performance.now();
                if (now - lastAt < SEEK_MIN_INTERVAL_MS) continue;
                if (video.seeking) continue;
                try {
                    video.currentTime = targetTime;
                    lastSeekTimes.set(idx, targetTime);
                    lastSeekAt.set(idx, now);
                } catch {
                    /* ignore */
                }
            }
        };

        const onReInit = () => {
            refreshCaches();
            rebuildActiveSet();
            apply();
        };

        const onResize = () => {
            refreshCaches();
            apply();
        };

        const onSlidesInView = () => {
            rebuildActiveSet();
            apply();
        };

        refreshCaches();
        rebuildActiveSet();
        apply();

        emblaApi.on('scroll', apply);
        emblaApi.on('settle', apply);
        emblaApi.on('slidesInView', onSlidesInView);
        emblaApi.on('reInit', onReInit);
        emblaApi.on('resize', onResize);

        return () => {
            emblaApi.off('scroll', apply);
            emblaApi.off('settle', apply);
            emblaApi.off('slidesInView', onSlidesInView);
            emblaApi.off('reInit', onReInit);
            emblaApi.off('resize', onResize);
            lastSeekTimes.clear();
            lastSeekAt.clear();
        };
    }, [emblaApi, enabled]);
};
