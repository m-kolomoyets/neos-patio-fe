import type { Continent, PatioType } from '@/services/patios/types';
import React from 'react';
import CloseIcon from '@/icons/close_24.svg?react';
import FilterIcon from '@/icons/filter_24.svg?react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { Separator } from '@/components/ui/Separator';
import { Typography } from '@/components/ui/Typography';
import { usePatioFilters } from '../../../../hooks/usePatioFilters';
import libraryToolbarStyles from '../../../LibraryToolbar/styles.module.css';
import { FilterSections } from '../FilterSections';
import s from './styles.module.css';

export const PatioFiltersDrawer: React.FC = () => {
    const { filters, setContinents, setTypes, resetFilters, hasActiveFilters } = usePatioFilters();

    const [open, setOpen] = React.useState(false);
    const [continents, setLocalContinents] = React.useState<Continent[]>([]);
    const [types, setLocalTypes] = React.useState<PatioType[]>([]);

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            setLocalContinents(filters.continents ?? []);
            setLocalTypes(filters.types ?? []);
        }
        setOpen(nextOpen);
    };

    const handleApply = () => {
        setContinents(continents);
        setTypes(types);
        setOpen(false);
    };

    const handleReset = () => {
        setLocalContinents([]);
        setLocalTypes([]);
        resetFilters();
        setOpen(false);
    };

    return (
        <Drawer.Root open={open} onOpenChange={handleOpenChange}>
            <span className={libraryToolbarStyles['trigger-wrap']}>
                <Drawer.Trigger
                    render={
                        <Button
                            isIcon
                            variant="surface"
                            size="md"
                            aria-label="Filter patios"
                            className={libraryToolbarStyles['trigger-button']}
                        >
                            <FilterIcon />
                            <span className="sr-only">Filter patios</span>
                        </Button>
                    }
                />
                {hasActiveFilters ? (
                    <NotificationBadge size="xs" value={0} className={libraryToolbarStyles.badge} />
                ) : null}
            </span>
            <Drawer.Portal>
                <Drawer.Backdrop />
                <Drawer.Viewport>
                    <Drawer.Popup>
                        <Drawer.Content>
                            <Drawer.Header>
                                <Drawer.Title render={<Typography variant="text-xs" />}>Filter by:</Drawer.Title>
                                <Drawer.Close
                                    className={clsx(s.cta, s.close)}
                                    render={
                                        <Button isIcon variant="surface" size="sm" aria-label="Close filters">
                                            <CloseIcon />
                                        </Button>
                                    }
                                />
                            </Drawer.Header>
                            <Separator className={s.separator} orientation="horizontal" />
                            <Drawer.Body>
                                <FilterSections
                                    continents={continents}
                                    types={types}
                                    onContinentsChange={setLocalContinents}
                                    onTypesChange={setLocalTypes}
                                />
                            </Drawer.Body>
                            <Drawer.Footer className={s.footer}>
                                <Button
                                    className={clsx(s.cta, s.apply)}
                                    variant="surface"
                                    size="md"
                                    onClick={handleApply}
                                >
                                    Filter
                                </Button>
                                <Button
                                    className={clsx(s.cta, s.reset)}
                                    variant="link"
                                    size="md"
                                    onClick={handleReset}
                                    disabled={!hasActiveFilters}
                                >
                                    Reset
                                </Button>
                            </Drawer.Footer>
                        </Drawer.Content>
                    </Drawer.Popup>
                </Drawer.Viewport>
            </Drawer.Portal>
        </Drawer.Root>
    );
};
