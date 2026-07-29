import type { GroupingMode } from '../../hooks/useGroupedPatios';
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
import { PatioLibraryCardSkeleton } from '../PatioLibraryCardSkeleton';
import s from './styles.module.css';

export const PatioLibrary: React.FC = () => {
    const { filters } = usePatioFilters();
    const { mode, items, groups, isError, refetch, hasNextPage, isFetched, isFetchingNextPage, fetchNextPage } =
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

    const hasCurrentData = mode === 'flat' ? (items?.length ?? 0) > 0 : (groups?.length ?? 0) > 0;
    const isEmpty = !hasCurrentData;

    const [snapshot, setSnapshot] = React.useState<{
        mode: GroupingMode;
        items: typeof items;
        groups: typeof groups;
    } | null>(null);
    const [trackedData, setTrackedData] = React.useState<{ items: typeof items; groups: typeof groups }>({
        items,
        groups,
    });

    if (trackedData.items !== items || trackedData.groups !== groups) {
        setTrackedData({ items, groups });
        if (isFetched && !isError && hasCurrentData) {
            setSnapshot({ mode, items, groups });
        }
    }

    const useSnapshot = !hasCurrentData && !(isFetched && isEmpty) && snapshot !== null;
    const displayMode = useSnapshot ? snapshot.mode : mode;
    const displayItems = useSnapshot ? snapshot.items : items;
    const displayGroups = useSnapshot ? snapshot.groups : groups;

    let body: React.ReactNode;
    if (isFetched && isError) {
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
    } else if (isFetched && isEmpty && !useSnapshot) {
        body = (
            <div className={s.empty}>
                <Typography variant="text-md">No patios found.</Typography>
            </div>
        );
    } else if (displayMode === 'flat' && displayItems) {
        body = (
            <>
                <div className={s.grid}>
                    {displayItems.map((patio) => {
                        return <PatioLibraryCard key={patio.id} patio={patio} />;
                    })}
                    {isFetchingNextPage
                        ? Array.from({ length: 4 }).map((_, i) => {
                              return <PatioLibraryCardSkeleton key={`skeleton-next-${i}`} />;
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
    } else if (displayGroups) {
        body = (
            <div className={s.groups}>
                {displayGroups.map((group) => {
                    return (
                        <section
                            key={group.key}
                            className={s.group}
                            data-letter={displayMode === 'alpha' ? group.key : undefined}
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
                <Typography variant="text-xl" className={s.title} render={<h2 />}>
                    Patio Library
                </Typography>
                <LibraryToolbar className={s.toolbar} />
            </header>
            {body}
        </section>
    );
};
