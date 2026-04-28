import { useEffect, useMemo } from 'react';
import { useInView } from '@/hooks/useInView';
import { useStickyStuck } from '@/hooks/useStickyStuck';
import { usePatiosListInfinite } from '@/services/patios/queries';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { HOME_SCROLL_ROOT_SELECTOR } from '../../constants';
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
    const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
        usePatiosListInfinite(filters);
    const { ref: headerRef, flag: isHeaderStuck } = useStickyStuck({
        rootSelector: HOME_SCROLL_ROOT_SELECTOR,
    });

    const [sentinelRef, sentinelInView] = useInView<HTMLDivElement>({ rootMargin: '200px' });

    useEffect(() => {
        if (sentinelInView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [sentinelInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const items = useMemo(() => {
        return (
            data?.pages.flatMap((p) => {
                return p.items;
            }) ?? []
        );
    }, [data]);

    let body: React.ReactNode;
    if (isLoading) {
        body = <SkeletonGrid count={8} />;
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
    } else if (items.length === 0) {
        body = (
            <div className={s.empty}>
                <Typography variant="text-md">No patios found.</Typography>
            </div>
        );
    } else {
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
                <div ref={sentinelRef} className={s.sentinel} aria-hidden />
            </>
        );
    }

    return (
        <section className={s.wrap}>
            <header ref={headerRef} className={s.header} data-stuck={isHeaderStuck || undefined}>
                <Typography variant="display-xs" className={s.title}>
                    Patio Library
                </Typography>
                <LibraryToolbar className={s.toolbar} />
            </header>
            {body}
        </section>
    );
};
