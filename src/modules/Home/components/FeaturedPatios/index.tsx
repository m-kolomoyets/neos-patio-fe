import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChevronLeftIcon from '@/icons/chevrone-left_24.svg?react';
import ChevronRightIcon from '@/icons/chevrone-right_24.svg?react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { getFeaturedPatiosQueryOptions } from '@/services/patios/queries';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useCarouselParallax } from './hooks/useCarouselParallax';
import { FeaturedPatioCard } from '../FeaturedPatioCard';
import s from './styles.module.css';

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

export const FeaturedPatios: React.FC = () => {
    const { data, isLoading } = useQuery(getFeaturedPatiosQueryOptions());
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [intersectingIds, setIntersectingIds] = useState<ReadonlySet<string>>(() => {
        return new Set();
    });
    const [reducedMotion, setReducedMotion] = useState<boolean>(prefersReducedMotion);
    const [staticCapable] = useState<boolean>(() => {
        return supportsHover() && !isSlowConnection();
    });
    const videoCapable = staticCapable && !reducedMotion;
    const rafIdRef = useRef<number | null>(null);

    const { registerSnap } = useCarouselParallax({ viewportRef, dataKey: data });

    const updateScrollEdges = useCallback(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        setCanScrollLeft(viewport.scrollLeft > 4);
        setCanScrollRight(viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 4);
    }, []);

    const handleScroll = useCallback(() => {
        if (rafIdRef.current !== null) return;
        rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;
            updateScrollEdges();
        });
    }, [updateScrollEdges]);

    useEffect(() => {
        updateScrollEdges();
        const viewport = viewportRef.current;
        if (!viewport) return;
        const onResize = () => {
            return updateScrollEdges();
        };
        viewport.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', onResize);
        return () => {
            viewport.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', onResize);
            if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
        };
    }, [updateScrollEdges, handleScroll, data]);

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
        const viewport = viewportRef.current;
        if (!viewport || !data?.length) return;
        if (!videoCapable) return;

        const observer = new IntersectionObserver(
            (entries) => {
                setIntersectingIds((prev) => {
                    const next = new Set(prev);
                    let changed = false;
                    for (const entry of entries) {
                        const id = (entry.target as HTMLElement).dataset.cardId;
                        if (!id) continue;
                        if (entry.isIntersecting) {
                            if (!next.has(id)) {
                                next.add(id);
                                changed = true;
                            }
                        } else if (next.has(id)) {
                            next.delete(id);
                            changed = true;
                        }
                    }
                    return changed ? next : prev;
                });
            },
            { root: viewport, threshold: 0 }
        );

        const cards = viewport.querySelectorAll<HTMLElement>('[data-card-id]');
        cards.forEach((card) => {
            return observer.observe(card);
        });
        return () => {
            return observer.disconnect();
        };
    }, [data, videoCapable]);

    const renderWindowIds = useMemo<ReadonlySet<string>>(() => {
        if (!videoCapable) return new Set<string>();
        if (!data?.length || intersectingIds.size === 0) return new Set<string>();
        const result = new Set<string>();
        const indexById = new Map(
            data.map((p, i) => {
                return [p.id, i];
            })
        );
        for (const id of intersectingIds) {
            const idx = indexById.get(id);
            if (idx === undefined) continue;
            result.add(id);
            if (idx > 0) result.add(data[idx - 1].id);
            if (idx < data.length - 1) result.add(data[idx + 1].id);
        }
        return result;
    }, [data, intersectingIds, videoCapable]);

    const scrollByPage = useCallback((direction: 1 | -1) => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        const cards = Array.from(viewport.querySelectorAll<HTMLElement>('[data-card-id]'));
        const viewportLeft = viewport.getBoundingClientRect().left;
        const cardOffsets = cards
            .map((card) => {
                return Math.round(card.getBoundingClientRect().left - viewportLeft + viewport.scrollLeft);
            })
            .sort((a, b) => {
                return a - b;
            });

        if (cardOffsets.length === 0) return;
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

    const handleSkipButtonClick = () => {
        document.getElementById('search-bar-trigger')?.focus();
    };

    return (
        <section className={s.wrap}>
            <Button className={s['skip-button']} variant="brand" size="md" onClick={handleSkipButtonClick}>
                Go to search bar
            </Button>
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
                              return (
                                  <FeaturedPatioCard
                                      key={patio.id}
                                      patio={patio}
                                      shouldMountVideo={renderWindowIds.has(patio.id)}
                                      registerSnap={registerSnap}
                                  />
                              );
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
