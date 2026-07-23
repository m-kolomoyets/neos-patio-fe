import type { GroupingMode } from '../../hooks/useGroupedPatios';
import React from 'react';
import { createPortal } from 'react-dom';
import { useInView } from 'react-intersection-observer';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useJsSticky } from '@/hooks/useJsSticky';
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
    const isMobile = useIsMobile();

    const { filters } = usePatioFilters();
    const { mode, items, groups, isError, refetch, hasNextPage, isFetched, isFetchingNextPage, fetchNextPage } =
        useGroupedPatios({
            ...filters,
            // NOTE: Search should work for search autocomplete only
            q: '',
        });
    const {
        containerRef,
        sentinelRef: stickySentinelRef,
        wrapperRef,
        headerRef,
        stuck: isHeaderStuck,
        headerHeight,
    } = useJsSticky({
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

    const headerInner = (
        <>
            <Typography
                variant={!isMobile && isHeaderStuck ? 'display-xs' : 'text-xl'}
                className={s.title}
                render={<h2 />}
            >
                Patio Library
            </Typography>
            <LibraryToolbar className={s.toolbar} />
        </>
    );

    return (
        <section ref={containerRef} className={s.wrap}>
            {isHeaderStuck ? (
                // Reserve the vacated height so flow doesn't jump when the header
                // leaves flow for the <body> portal.
                <div className={s['header-spacer']} style={{ height: headerHeight }} aria-hidden="true" />
            ) : (
                // In flow, position: static — scrolls natively with the content,
                // no JS positioning, no glitch. Portaled + fixed only once stuck.
                <header ref={headerRef} className={s.header}>
                    {headerInner}
                </header>
            )}
            {/* 0-height marker at the header's BOTTOM edge; stuck flips only once
                it crosses the container top (header fully out of view). */}
            <div ref={stickySentinelRef} className={s['header-sentinel']} aria-hidden="true" />
            {isHeaderStuck
                ? createPortal(
                      // Fixed clip window at the panel top; the header slides in
                      // from above (overflow: hidden reveals it emerging from the
                      // top edge). Portaled so backdrop-filter escapes the squircle
                      // clip-path backdrop root.
                      <div ref={wrapperRef} className={s['header-portal']}>
                          <header ref={headerRef} className={s.header} data-stuck="true">
                              {headerInner}
                          </header>
                      </div>,
                      document.body
                  )
                : null}
            {body}
        </section>
    );
};
