import React from 'react';
import { useInView } from 'react-intersection-observer';
import { useStickyStuck } from '@/hooks/useStickyStuck';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Separator } from '@/components/ui/Separator';
import { Typography } from '@/components/ui/Typography';
import { HOME_SCROLL_ROOT_SELECTOR } from '../../constants';
import { useGroupedPatios } from '../../hooks/useGroupedPatios';
import { usePatioFilters } from '../../hooks/usePatioFilters';
import { LibraryToolbar } from '../LibraryToolbar';
import { PatioLibraryCard } from '../PatioLibraryCard';
import s from './styles.module.css';

const SkeletonGrid: React.FC<{ count: number }> = ({ count }) => {
    return (
        <div className={s.grid}>
            {Array.from({ length: count }).map((_, i) => {
                return <div key={i} className={s['skeleton-card']} />;
            })}
        </div>
    );
};

export const PatioLibrary: React.FC = () => {
    const { filters } = usePatioFilters();
    const { mode, items, groups, isLoading, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
        useGroupedPatios({
            ...filters,
            // NOTE: Search should work for search autocomplete only
            q: '',
        });
    const { ref: headerRef, flag: isHeaderStuck } = useStickyStuck({
        rootSelector: HOME_SCROLL_ROOT_SELECTOR,
    });

    const [sentinelRef, sentinelInView] = useInView({
        threshold: 0.75,
    });

    const isEmpty = mode === 'flat' ? (items?.length ?? 0) === 0 : (groups?.length ?? 0) === 0;

    let body: React.ReactNode;
    if (isLoading) {
        body = <SkeletonGrid count={12} />;
    } else if (isError) {
        body = (
            <div className={s.error}>
                <Typography variant="text-md">Failed to load patios.</Typography>
                <Button
                    variant="surface"
                    size="md"
                    onClick={() => {
                        return refetch();
                    }}
                >
                    Try again
                </Button>
            </div>
        );
    } else if (isEmpty) {
        body = (
            <div className={s.empty}>
                <Typography variant="text-md">No patios found.</Typography>
            </div>
        );
    } else if (mode === 'flat' && items) {
        body = (
            <>
                <div className={s.grid}>
                    {items.map((patio) => {
                        return <PatioLibraryCard key={patio.id} patio={patio} />;
                    })}
                    {isFetchingNextPage
                        ? Array.from({ length: 4 }).map((_, i) => {
                              return <div key={`skeleton-next-${i}`} className={s['skeleton-card']} />;
                          })
                        : null}
                </div>
                {hasNextPage ? (
                    <div ref={sentinelRef} className={s.sentinel}>
                        <LoadingSpinner />
                        <span className="sr-only">Loading more patios...</span>
                    </div>
                ) : null}
            </>
        );
    } else if (groups) {
        body = (
            <div className={s.groups}>
                {groups.map((group) => {
                    return (
                        <section
                            key={group.key}
                            className={s.group}
                            data-letter={mode === 'alpha' ? group.key : undefined}
                        >
                            <Typography variant="text-md" render={<h3 />} className={s['group-title']}>
                                {group.title}
                            </Typography>
                            <Separator className={s['group-separator']} />
                            <div className={s.grid}>
                                {group.items.map((patio) => {
                                    return <PatioLibraryCard key={patio.id} patio={patio} />;
                                })}
                            </div>
                        </section>
                    );
                })}
            </div>
        );
    }

    React.useEffect(() => {
        if (mode !== 'flat') {
            return;
        }
        if (sentinelInView && hasNextPage && !isFetchingNextPage && fetchNextPage) {
            fetchNextPage();
        }
    }, [mode, sentinelInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <section className={s.wrap}>
            <header ref={headerRef} className={s.header} data-stuck={isHeaderStuck || undefined}>
                <Typography variant="display-xs" className={s.title} render={<h2 />}>
                    Patio Library
                </Typography>
                <LibraryToolbar className={s.toolbar} />
            </header>
            {body}
        </section>
    );
};
