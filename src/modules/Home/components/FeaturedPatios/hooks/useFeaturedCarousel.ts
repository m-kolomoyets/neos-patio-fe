import type { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

type Params = {
    dataKey: unknown;
};

type Result = {
    emblaRef: ReturnType<typeof useEmblaCarousel>[0];
    emblaApi: EmblaCarouselType | undefined;
    selectedIndex: number;
    snapList: readonly number[];
    scrollPrev: () => void;
    scrollNext: () => void;
    scrollTo: (_index: number) => void;
    reducedMotion: boolean;
    videoCapable: boolean;
    slidesInViewWithNeighbors: ReadonlySet<number>;
};

const EMPTY_SET: ReadonlySet<number> = new Set<number>();

const isSlowConnection = (): boolean => {
    if (typeof navigator === 'undefined') return false;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (!conn) return false;
    if (conn.saveData) return true;
    return conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g';
};

const supportsHover = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: hover)').matches;
};

const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const buildOptions = (reducedMotion: boolean): EmblaOptionsType => {
    if (reducedMotion) {
        return { loop: false, align: 'start', dragFree: false, containScroll: 'trimSnaps', duration: 0 };
    }
    return { loop: true, align: 'start', dragFree: false, containScroll: 'trimSnaps' };
};

export const useFeaturedCarousel = ({ dataKey }: Params): Result => {
    const [reducedMotion, setReducedMotion] = useState<boolean>(prefersReducedMotion);
    const [staticCapable] = useState<boolean>(() => {
        return supportsHover() && !isSlowConnection();
    });
    const videoCapable = staticCapable && !reducedMotion;

    const [emblaRef, emblaApi] = useEmblaCarousel(buildOptions(reducedMotion));
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [snapList, setSnapList] = useState<readonly number[]>([]);
    const [slidesInViewWithNeighbors, setSlidesInViewWithNeighbors] = useState<ReadonlySet<number>>(EMPTY_SET);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = () => {
            return setReducedMotion(mq.matches);
        };
        mq.addEventListener('change', onChange);
        return () => {
            mq.removeEventListener('change', onChange);
        };
    }, []);

    useEffect(() => {
        if (!emblaApi) return;
        const sync = () => {
            setSelectedIndex(emblaApi.selectedScrollSnap());
            setSnapList(emblaApi.scrollSnapList());
        };
        sync();
        emblaApi.on('select', sync);
        emblaApi.on('reInit', sync);
        return () => {
            emblaApi.off('select', sync);
            emblaApi.off('reInit', sync);
        };
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.reInit(buildOptions(reducedMotion));
    }, [emblaApi, reducedMotion, dataKey]);

    useEffect(() => {
        if (!emblaApi || !videoCapable) return;
        const NEIGHBOR_RADIUS = 2;
        const EAGER_MOUNT_THRESHOLD = 8;
        const sync = () => {
            const inView = emblaApi.slidesInView();
            const total = emblaApi.scrollSnapList().length;
            if (total === 0) {
                setSlidesInViewWithNeighbors(EMPTY_SET);
                return;
            }
            if (total <= EAGER_MOUNT_THRESHOLD) {
                const all = new Set<number>();
                for (let i = 0; i < total; i++) all.add(i);
                setSlidesInViewWithNeighbors(all);
                return;
            }
            if (inView.length === 0) {
                setSlidesInViewWithNeighbors(EMPTY_SET);
                return;
            }
            const looped = emblaApi.internalEngine().options.loop === true;
            const next = new Set<number>();
            for (const idx of inView) {
                for (let offset = -NEIGHBOR_RADIUS; offset <= NEIGHBOR_RADIUS; offset++) {
                    const target = idx + offset;
                    if (target >= 0 && target < total) {
                        next.add(target);
                    } else if (looped) {
                        next.add(((target % total) + total) % total);
                    }
                }
            }
            setSlidesInViewWithNeighbors(next);
        };
        emblaApi.on('slidesInView', sync);
        emblaApi.on('reInit', sync);
        queueMicrotask(sync);
        return () => {
            emblaApi.off('slidesInView', sync);
            emblaApi.off('reInit', sync);
        };
    }, [emblaApi, videoCapable]);

    const scrollPrev = useCallback(() => {
        return emblaApi?.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        return emblaApi?.scrollNext();
    }, [emblaApi]);

    const scrollTo = useCallback(
        (index: number) => {
            return emblaApi?.scrollTo(index);
        },
        [emblaApi]
    );

    return {
        emblaRef,
        emblaApi,
        selectedIndex,
        snapList,
        scrollPrev,
        scrollNext,
        scrollTo,
        reducedMotion,
        videoCapable,
        slidesInViewWithNeighbors: videoCapable ? slidesInViewWithNeighbors : EMPTY_SET,
    };
};
