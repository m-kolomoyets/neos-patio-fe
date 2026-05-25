import type { EmblaCarouselType } from 'embla-carousel';
import { useEffect } from 'react';

type Params = {
    emblaApi: EmblaCarouselType | undefined;
    enabled: boolean;
};

const MAX_TRANSLATE_PX = 48;

const wrapDiff = (diff: number): number => {
    if (diff > 0.5) return diff - 1;
    if (diff < -0.5) return diff + 1;
    return diff;
};

export const useCarouselParallax = ({ emblaApi, enabled }: Params): void => {
    useEffect(() => {
        if (!emblaApi) return;

        if (!enabled) {
            for (const node of emblaApi.slideNodes()) {
                node.style.removeProperty('--parallax-x');
            }
            return;
        }

        const apply = () => {
            const progress = emblaApi.scrollProgress();
            const snaps = emblaApi.scrollSnapList();
            const nodes = emblaApi.slideNodes();
            const looped = emblaApi.internalEngine().options.loop === true;
            for (let i = 0; i < snaps.length; i++) {
                const node = nodes[i];
                if (!node) continue;
                const rawDiff = snaps[i] - progress;
                const diff = looped ? wrapDiff(rawDiff) : rawDiff;
                const clamped = Math.max(-1, Math.min(1, diff));
                const translate = clamped * MAX_TRANSLATE_PX;
                node.style.setProperty('--parallax-x', translate.toFixed(2));
            }
        };

        apply();
        emblaApi.on('scroll', apply);
        emblaApi.on('reInit', apply);
        emblaApi.on('select', apply);
        emblaApi.on('settle', apply);
        emblaApi.on('slidesInView', apply);
        return () => {
            emblaApi.off('scroll', apply);
            emblaApi.off('reInit', apply);
            emblaApi.off('select', apply);
            emblaApi.off('settle', apply);
            emblaApi.off('slidesInView', apply);
            for (const node of emblaApi.slideNodes()) {
                node.style.removeProperty('--parallax-x');
            }
        };
    }, [emblaApi, enabled]);
};
