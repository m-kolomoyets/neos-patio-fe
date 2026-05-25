import type { EmblaCarouselType } from 'embla-carousel';
import { useEffect } from 'react';
import { computeActiveSet } from '../utils/computeActiveSet';
import { computeViewportProgress } from '../utils/computeViewportProgress';

type Params = {
    emblaApi: EmblaCarouselType | undefined;
    enabled: boolean;
};

const NEIGHBOR_RADIUS = 1;
const SEEK_MIN_DELTA_SEC = 0.03;
const SEEK_MIN_INTERVAL_MS = 1000 / 60;

export const useCarouselVideoScrub = ({ emblaApi, enabled }: Params): void => {
    useEffect(() => {
        if (!emblaApi || !enabled) return;

        const slideWidths: number[] = [];
        const viewportMetrics = { center: 0, halfWidth: 0 };
        const lastSeekTimes = new Map<number, number>();
        const lastSeekAt = new Map<number, number>();
        let activeSet: ReadonlySet<number> = new Set<number>();

        const refreshCaches = () => {
            const nodes = emblaApi.slideNodes();
            slideWidths.length = nodes.length;
            for (let i = 0; i < nodes.length; i++) {
                slideWidths[i] = nodes[i]?.getBoundingClientRect().width ?? 0;
            }
            const viewportRect = emblaApi.rootNode().getBoundingClientRect();
            viewportMetrics.center = viewportRect.x + viewportRect.width / 2;
            viewportMetrics.halfWidth = viewportRect.width / 2;
        };

        const rebuildActiveSet = () => {
            const total = emblaApi.scrollSnapList().length;
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

        const apply = () => {
            if (activeSet.size === 0) return;
            const nodes = emblaApi.slideNodes();
            type Read = {
                idx: number;
                centerX: number;
                video: HTMLVideoElement;
                duration: number;
                phaseIdle: boolean;
            };
            const reads: Read[] = [];
            for (const idx of activeSet) {
                const node = nodes[idx];
                if (!node) continue;
                const video = node.querySelector<HTMLVideoElement>('video');
                if (!video || !Number.isFinite(video.duration) || video.duration <= 0) continue;
                const card = node.querySelector<HTMLElement>('[data-card-id]');
                const phaseIdle = card?.getAttribute('data-phase') === 'idle';
                const width = slideWidths[idx] ?? node.getBoundingClientRect().width;
                const rect = node.getBoundingClientRect();
                reads.push({
                    idx,
                    centerX: rect.x + width / 2,
                    video,
                    duration: video.duration,
                    phaseIdle,
                });
            }
            for (const r of reads) {
                const progress = computeViewportProgress({
                    slideCenterX: r.centerX,
                    viewportCenterX: viewportMetrics.center,
                    viewportHalfWidth: viewportMetrics.halfWidth,
                });
                const targetTime = progress * r.duration;
                r.video.dataset.scrubTime = targetTime.toFixed(3);
                if (!r.phaseIdle) continue;
                const last = lastSeekTimes.get(r.idx);
                if (last !== undefined && Math.abs(targetTime - last) < SEEK_MIN_DELTA_SEC) continue;
                const lastAt = lastSeekAt.get(r.idx) ?? 0;
                const now = performance.now();
                if (now - lastAt < SEEK_MIN_INTERVAL_MS) continue;
                if (r.video.seeking) continue;
                try {
                    r.video.currentTime = targetTime;
                    lastSeekTimes.set(r.idx, targetTime);
                    lastSeekAt.set(r.idx, now);
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
