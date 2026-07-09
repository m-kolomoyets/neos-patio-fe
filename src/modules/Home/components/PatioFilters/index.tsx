import type { Continent, PatioType } from '@/services/patios/types';
import React from 'react';
import FilterIcon from '@/icons/filter_24.svg?react';
import { Popover } from '@base-ui/react/popover';
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { useDebouncedEffect } from '@react-hookz/web';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { PopupWrapper } from '@/components/ui/PopupWrapper';
import { Separator } from '@/components/ui/Separator';
import { Typography } from '@/components/ui/Typography';
import { CONTINENT_LABELS, FILTERS_DEBOUNCE_MS, TYPE_LABELS } from './constants';
import { usePatioFilters } from '../../hooks/usePatioFilters';
import libraryToolbarStyles from '../LibraryToolbar/styles.module.css';
import s from './styles.module.css';

export const PatioFilters: React.FC = () => {
    const { filters, setContinents, setTypes, resetFilters, hasActiveFilters } = usePatioFilters();

    const [continents, setLocalContinents] = React.useState<Continent[]>(() => {
        return filters.continents ?? [];
    });
    const [types, setLocalTypes] = React.useState<PatioType[]>(() => {
        return filters.types ?? [];
    });

    const handleReset = () => {
        setLocalContinents([]);
        setLocalTypes([]);
        resetFilters();
    };

    useDebouncedEffect(
        () => {
            setContinents(continents);
        },
        [continents],
        FILTERS_DEBOUNCE_MS
    );

    useDebouncedEffect(
        () => {
            setTypes(types);
        },
        [types],
        FILTERS_DEBOUNCE_MS
    );

    return (
        <Popover.Root modal>
            <span className={libraryToolbarStyles['trigger-wrap']}>
                <Popover.Trigger
                    render={
                        <Button
                            isIcon
                            variant="surface"
                            size="md"
                            aria-label="Filter patios"
                            className={libraryToolbarStyles['trigger-button']}
                        >
                            <FilterIcon />
                        </Button>
                    }
                />
                {hasActiveFilters ? (
                    <NotificationBadge size="xs" value={0} className={libraryToolbarStyles.badge} />
                ) : null}
            </span>
            <Popover.Portal>
                <Popover.Positioner side="bottom" align="end" sideOffset={8}>
                    <Popover.Popup render={<PopupWrapper className={s.popup} />}>
                        <div className={s.header}>
                            <Typography variant="text-xs" className={s.heading}>
                                Filter by:
                            </Typography>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={handleReset}
                                title="Reset filters"
                                disabled={!hasActiveFilters}
                                className={s['reset-button']}
                            >
                                Reset
                            </Button>
                        </div>
                        <Separator orientation="horizontal" />
                        <div className={s.section}>
                            <Typography variant="text-xs" className={s['section-label']}>
                                Continent
                            </Typography>
                            <BaseToggleGroup
                                className={s.group}
                                multiple
                                value={continents}
                                onValueChange={(value) => {
                                    return setLocalContinents(value as Continent[]);
                                }}
                            >
                                {CONTINENT_LABELS.map(({ value, label }) => {
                                    return (
                                        <Chip key={value} size="lg" value={value}>
                                            {label}
                                        </Chip>
                                    );
                                })}
                            </BaseToggleGroup>
                        </div>

                        <div className={s.section}>
                            <Typography variant="text-xs" className={s['section-label']}>
                                Type
                            </Typography>
                            <BaseToggleGroup
                                className={s.group}
                                multiple
                                value={types}
                                onValueChange={(value) => {
                                    return setLocalTypes(value as PatioType[]);
                                }}
                            >
                                {TYPE_LABELS.map(({ value, label }) => {
                                    return (
                                        <Chip key={value} size="lg" value={value}>
                                            {label}
                                        </Chip>
                                    );
                                })}
                            </BaseToggleGroup>
                        </div>
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
};
