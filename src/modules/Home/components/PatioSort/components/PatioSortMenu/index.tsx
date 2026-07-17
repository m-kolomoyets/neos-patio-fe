import type { SortKey } from '@/services/patios/types';
import React from 'react';
import CheckmarkIcon from '@/icons/checkmark-circle-filled_24.svg?react';
import SortIcon from '@/icons/sort_24.svg?react';
import { Menu } from '@base-ui/react/menu';
import { Button } from '@/components/ui/Button';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { PopupWrapper } from '@/components/ui/PopupWrapper';
import { Separator } from '@/components/ui/Separator';
import { Typography } from '@/components/ui/Typography';
import { SORT_OPTIONS } from '../../constants';
import { usePatioFilters } from '../../../../hooks/usePatioFilters';
import libraryToolbarStyles from '../../../LibraryToolbar/styles.module.css';
import s from './styles.module.css';

export const PatioSortMenu: React.FC = () => {
    const { filters, setSort, resetSort, hasActiveSort } = usePatioFilters();

    return (
        <Menu.Root>
            <span className={libraryToolbarStyles['trigger-wrap']}>
                <Menu.Trigger
                    render={
                        <Button
                            isIcon
                            variant="surface"
                            size="md"
                            aria-label="Sort patios"
                            className={libraryToolbarStyles['trigger-button']}
                        >
                            <SortIcon />
                        </Button>
                    }
                />
                {hasActiveSort ? (
                    <NotificationBadge size="xs" value={0} className={libraryToolbarStyles.badge} />
                ) : null}
            </span>
            <Menu.Portal>
                <Menu.Positioner side="bottom" align="end" sideOffset={8}>
                    <Menu.Popup render={<PopupWrapper className={s.popup} />}>
                        <div className={s.header}>
                            <Typography variant="text-xs" className={s.heading}>
                                Sort by:
                            </Typography>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={resetSort}
                                disabled={!hasActiveSort}
                                className={s['reset-button']}
                            >
                                Reset
                            </Button>
                        </div>
                        <Separator orientation="horizontal" />
                        <Menu.RadioGroup
                            value={filters.sort ?? null}
                            onValueChange={(value) => {
                                return setSort((value as SortKey) ?? undefined);
                            }}
                        >
                            {SORT_OPTIONS.map(({ value, label, Icon }) => {
                                return (
                                    <Menu.RadioItem key={value} value={value} className={s.item}>
                                        <Icon className={s.icon} />
                                        <Typography variant="text-sm" className={s.label}>
                                            {label}
                                        </Typography>
                                        <Menu.RadioItemIndicator>
                                            <CheckmarkIcon className={s.checkmark} />
                                        </Menu.RadioItemIndicator>
                                    </Menu.RadioItem>
                                );
                            })}
                        </Menu.RadioGroup>
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Portal>
        </Menu.Root>
    );
};
