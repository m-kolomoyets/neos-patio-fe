import { useCallback, useEffect, useRef, useState } from 'react';
import ChevronLeftIcon from '@/icons/chevrone-left_24.svg?react';
import ChevronRightIcon from '@/icons/chevrone-right_24.svg?react';
import clsx from 'clsx';
import { useStickyStuck } from '@/hooks/useStickyStuck';
import { useFeaturedPatios } from '@/services/patios/queries';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Typography } from '@/components/ui/Typography';
import { HOME_SCROLL_ROOT_SELECTOR } from '../../constants';
import { FeaturedPatioCard } from '../FeaturedPatioCard';
import s from './styles.module.css';

const PARALLAX_RANGE = 40;

export const FeaturedPatios: React.FC = () => {
    const { data, isLoading } = useFeaturedPatios();
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const rafIdRef = useRef<number | null>(null);
    const { ref: headerRef, flag: isHeaderStuck } = useStickyStuck({
        rootSelector: HOME_SCROLL_ROOT_SELECTOR,
    });

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
            updateParallax();
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

        if (!viewport) {
            return;
        }

        const cards = Array.from(viewport.querySelectorAll<HTMLElement>('[data-card-id]'));
        const viewportLeft = viewport.getBoundingClientRect().left;
        const cardOffsets = cards
            .map((card) => {
                return Math.round(card.getBoundingClientRect().left - viewportLeft + viewport.scrollLeft);
            })
            .sort((a, b) => {
                return a - b;
            });

        if (cardOffsets.length === 0) {
            return;
        }

        const current = viewport.scrollLeft;
        const epsilon = 1;
        const target =
            direction === 1
                ? (cardOffsets.find((offset) => {
                      return offset > current + epsilon;
                  }) ?? cardOffsets[cardOffsets.length - 1])
                : ([...cardOffsets].reverse().find((offset) => {
                      return offset < current - epsilon;
                  }) ?? cardOffsets[0]);
        viewport.scrollTo({ left: target, behavior: 'smooth' });
    }, []);

    return (
        <section className={s.wrap}>
            <div ref={headerRef} className={s.header} data-stuck={isHeaderStuck || undefined}>
                <Typography variant="display-xs" className={s.title} render={<h2 />}>
                    Featured Patios
                </Typography>
                <span className={s.background} aria-hidden />
            </div>
            <ScrollArea
                className={s.scroll}
                orientation="horizontal"
                viewportRef={viewportRef}
                viewportClassName={s.viewport}
            >
                <div className={s.track}>
                    {isLoading
                        ? Array.from({ length: 3 }).map((_, i) => {
                              return <div key={i} className={s['skeleton-card']} />;
                          })
                        : data?.map((patio) => {
                              return <FeaturedPatioCard key={patio.id} patio={patio} />;
                          })}
                </div>
                <Button
                    isIcon
                    variant="surface"
                    size="md"
                    title="Previous featured patios"
                    data-direction="prev"
                    className={clsx(s['control-button'], s.prev)}
                    disabled={!canScrollLeft}
                    onClick={() => {
                        return scrollByPage(-1);
                    }}
                >
                    <ChevronLeftIcon />
                    <span className="sr-only">Previous featured patios</span>
                </Button>
                <Button
                    isIcon
                    variant="surface"
                    size="md"
                    title="Next featured patios"
                    data-direction="next"
                    className={clsx(s['control-button'], s.next)}
                    disabled={!canScrollRight}
                    onClick={() => {
                        return scrollByPage(1);
                    }}
                >
                    <ChevronRightIcon />
                    <span className="sr-only">Next featured patios</span>
                </Button>
            </ScrollArea>
        </section>
    );
};
