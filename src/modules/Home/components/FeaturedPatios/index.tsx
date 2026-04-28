import { useCallback, useEffect, useRef, useState } from 'react';
import ChevronLeftIcon from '@/icons/chevrone-left_24.svg?react';
import ChevronRightIcon from '@/icons/chevrone-right_24.svg?react';
import { useFeaturedPatios } from '@/services/patios/queries';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Typography } from '@/components/ui/Typography';
import { FeaturedPatioCard } from '../FeaturedPatioCard';
import s from './styles.module.css';

const PARALLAX_RANGE = 40;

export const FeaturedPatios: React.FC = () => {
    const { data, isLoading } = useFeaturedPatios();
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const rafIdRef = useRef<number | null>(null);

    const updateParallax = useCallback(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const viewportRect = viewport.getBoundingClientRect();
        const viewportCenter = viewportRect.left + viewportRect.width / 2;

        const cards = viewport.querySelectorAll<HTMLElement>('[data-card-id]');
        cards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            const cardCenter = rect.left + rect.width / 2;
            const progress = (cardCenter - viewportCenter) / viewportRect.width;
            const clamped = Math.max(-1, Math.min(1, progress));
            card.style.setProperty('--parallax-x', String(clamped * -PARALLAX_RANGE));
        });

        setCanScrollLeft(viewport.scrollLeft > 4);
        setCanScrollRight(viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 4);
    }, []);

    const handleScroll = useCallback(() => {
        if (rafIdRef.current !== null) return;
        rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;
            updateParallax();
        });
    }, [updateParallax]);

    useEffect(() => {
        updateParallax();
        const viewport = viewportRef.current;
        if (!viewport) return;
        const onResize = () => {
            return updateParallax();
        };
        viewport.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', onResize);
        return () => {
            viewport.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', onResize);
            if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
        };
    }, [updateParallax, handleScroll, data]);

    const scrollByPage = useCallback((direction: 1 | -1) => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        const firstCard = viewport.querySelector<HTMLElement>('[data-card-id]');
        const cardWidth = firstCard?.getBoundingClientRect().width ?? viewport.clientWidth / 3;
        viewport.scrollBy({ left: direction * cardWidth * 3, behavior: 'smooth' });
    }, []);

    return (
        <section className={s.wrap}>
            <div className={s.header}>
                <Typography variant="display-xs" className={s.title}>
                    Featured Patios
                </Typography>
                <div className={s.controls}>
                    <Button
                        isIcon
                        variant="surface"
                        size="md"
                        aria-label="Previous featured patios"
                        className={s['control-button']}
                        disabled={!canScrollLeft}
                        onClick={() => {
                            return scrollByPage(-1);
                        }}
                    >
                        <ChevronLeftIcon />
                    </Button>
                    <Button
                        isIcon
                        variant="surface"
                        size="md"
                        aria-label="Next featured patios"
                        className={s['control-button']}
                        disabled={!canScrollRight}
                        onClick={() => {
                            return scrollByPage(1);
                        }}
                    >
                        <ChevronRightIcon />
                    </Button>
                </div>
            </div>
            <ScrollArea orientation="horizontal" viewportRef={viewportRef} viewportClassName={s.viewport}>
                <div className={s.track}>
                    {isLoading
                        ? Array.from({ length: 3 }).map((_, i) => {
                              return <div key={i} className={s['skeleton-card']} />;
                          })
                        : data?.map((patio) => {
                              return <FeaturedPatioCard key={patio.id} patio={patio} />;
                          })}
                </div>
            </ScrollArea>
        </section>
    );
};
