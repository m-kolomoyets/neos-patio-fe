import type { Continent, PatioType } from '@/services/patios/types';
import FilterIcon from '@/icons/filter_24.svg?react';
import { Popover } from '@base-ui/react/popover';
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { PopupWrapper } from '@/components/ui/PopupWrapper';
import { Typography } from '@/components/ui/Typography';
import { CONTINENT_LABELS, TYPE_LABELS } from './constants';
import { usePatioFilters } from '../../hooks/usePatioFilters';
import libraryToolbarStyles from '../LibraryToolbar/styles.module.css';
import s from './styles.module.css';

export const PatioFilters: React.FC = () => {
    const { filters, setContinents, setTypes, resetFilters, hasActiveFilters } = usePatioFilters();

    return (
        <Popover.Root>
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
                            <Typography variant="text-sm" className={s.heading}>
                                Filter by:
                            </Typography>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={resetFilters}
                                disabled={!hasActiveFilters}
                                className={s['reset-button']}
                            >
                                Reset
                            </Button>
                        </div>

                        <div className={s.section}>
                            <Typography variant="text-xs" className={s['section-label']}>
                                Continent
                            </Typography>
                            <BaseToggleGroup
                                className={s.group}
                                multiple
                                value={filters.continents ?? []}
                                onValueChange={(value) => {
                                    return setContinents(value as Continent[]);
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
                                value={filters.types ?? []}
                                onValueChange={(value) => {
                                    return setTypes(value as PatioType[]);
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
