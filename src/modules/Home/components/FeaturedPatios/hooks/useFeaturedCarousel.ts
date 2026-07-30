import type { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useIsMobileLandscape } from '@/hooks/useIsMobileLandscape';
import { computeActiveSet } from '../utils/computeActiveSet';
import { isWeakDevice } from '../utils/detectDeviceSeed';
import { useVideoPerfGuard } from './useVideoPerfGuard';

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
    /** Cleared for weak/slow devices and once the perf guard degrades: no video may mount. */
    videoCapable: boolean;
    /** Cursor-driven marquee autoplay: on wherever a cursor exists and motion is not opted out of. */
    motionCapable: boolean;
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

// Left gutter (red-line visual point) = var(--gap-5) - var(--gap-0-5) = 1.25rem - 0.125rem.
const SLIDE_GUTTER_REM = 1.125;

// Embla clamps the first/last snap to the scroll bounds (ScrollContain.measureBounded), so this
// offset is ignored for the edge slides — their gutter comes from the .slide:first/last-child
// padding — and applied only to the middle slides, aligning their content to the same gutter.
const alignToGutter = (): number => {
    if (typeof window === 'undefined') {
        return 0;
    }
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return SLIDE_GUTTER_REM * rootFontSize;
};

const buildOptions = (reducedMotion: boolean, isMobile: boolean): EmblaOptionsType => {
    // One slide per view on mobile: snap each slide flush to the viewport start so no
    // sliver of the previous slide peeks. The gutter align only matters for the peeking
    // multi-slide desktop layout.
    const align: EmblaOptionsType['align'] = isMobile ? 'start' : alignToGutter;
    if (reducedMotion) {
        return {
            loop: false,
            align,
            dragFree: false,
            containScroll: 'trimSnaps',
            duration: 0,
            skipSnaps: true,
        };
    }
    return { loop: false, align, dragFree: false, containScroll: 'trimSnaps' };
};

export const useFeaturedCarousel = ({ dataKey }: Params): Result => {
    const isMobilePortrait = useIsMobile();
    const isMobileLandscape = useIsMobileLandscape();

    const isMobile = isMobileLandscape || isMobilePortrait;

    const [reducedMotion, setReducedMotion] = useState<boolean>(prefersReducedMotion);
    const [staticCapable] = useState<boolean>(() => {
        return supportsHover() && !isSlowConnection() && !isWeakDevice();
    });

    const [emblaRef, emblaApi] = useEmblaCarousel(buildOptions(reducedMotion, isMobile));
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [snapList, setSnapList] = useState<readonly number[]>([]);
    const [slidesInViewWithNeighbors, setSlidesInViewWithNeighbors] = useState<ReadonlySet<number>>(EMPTY_SET);
    // True between the first scroll and 'settle' — the only window where videos actually seek and
    // decode, so the only window worth measuring. Sampling an idle carousel just measures idle FPS.
    const [isScrubbing, setIsScrubbing] = useState(false);

    // Any mounted video with metadata will do: they all decode the same way, and the guard only
    // needs one element's decode/drop counters to judge the pipeline.
    const getSampleVideo = useCallback((): HTMLVideoElement | null => {
        if (!emblaApi) return null;
        for (const node of emblaApi.slideNodes()) {
            const video = node.querySelector<HTMLVideoElement>('video');
            if (video && video.readyState >= HTMLMediaElement.HAVE_METADATA) return video;
        }
        return null;
    }, [emblaApi]);

    const staticGate = !isMobile && staticCapable && !reducedMotion;
    // Runtime measurement is the source of truth; the static seed above only culls obviously weak
    // hardware. Sample only while videos are mounted *and* scrubbing.
    const { degraded } = useVideoPerfGuard({
        enabled: staticGate && isScrubbing && slidesInViewWithNeighbors.size > 0,
        getSampleVideo,
    });
    const videoCapable = staticGate && !degraded;
    // Cursor-driven scrolling is the carousel's primary navigation, so device power never gates it:
    // no weak-hardware seed, no perf degrade. Only the two cases where it cannot work at all —
    // no cursor (mobile) and an explicit reduced-motion preference — turn it off.
    const motionCapable = !isMobile && !reducedMotion;

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
        emblaApi.reInit(buildOptions(reducedMotion, isMobile));
    }, [emblaApi, reducedMotion, isMobile, dataKey]);

    useEffect(
        function trackScrubActivity() {
            if (!emblaApi) return;
            const onMove = () => {
                setIsScrubbing(true);
            };
            const onStop = () => {
                setIsScrubbing(false);
            };
            emblaApi.on('scroll', onMove);
            emblaApi.on('pointerDown', onMove);
            emblaApi.on('settle', onStop);
            // reInit emits 'scroll' while measuring but never a matching 'settle', which would pin
            // the flag on and leave the guard sampling an idle carousel.
            emblaApi.on('reInit', onStop);
            return () => {
                emblaApi.off('scroll', onMove);
                emblaApi.off('pointerDown', onMove);
                emblaApi.off('settle', onStop);
                emblaApi.off('reInit', onStop);
            };
        },
        [emblaApi]
    );

    useEffect(() => {
        if (!emblaApi) return;
        const NEIGHBOR_RADIUS = 2;
        const EAGER_MOUNT_THRESHOLD = 8;
        const sync = () => {
            const inView = emblaApi.slidesInView();
            // Slide count, not snap count: containScroll: 'trimSnaps' yields fewer snaps than
            // slides, and slidesInView() reports slide indices — using snap count drops the
            // trailing slides so the last card's video never mounts.
            const total = emblaApi.slideNodes().length;
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
            setSlidesInViewWithNeighbors(computeActiveSet(inView, total, NEIGHBOR_RADIUS, looped));
        };
        emblaApi.on('slidesInView', sync);
        emblaApi.on('reInit', sync);
        queueMicrotask(sync);
        return () => {
            emblaApi.off('slidesInView', sync);
            emblaApi.off('reInit', sync);
        };
    }, [emblaApi]);

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
        motionCapable,
        slidesInViewWithNeighbors: videoCapable ? slidesInViewWithNeighbors : EMPTY_SET,
    };
};
