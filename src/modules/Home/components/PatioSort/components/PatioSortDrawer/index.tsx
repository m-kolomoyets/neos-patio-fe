import type { SortKey } from '@/services/patios/types';
import React from 'react';
import CloseIcon from '@/icons/close_24.svg?react';
import SortIcon from '@/icons/sort_24.svg?react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { OptionItem } from '@/components/ui/OptionItem';
import { Separator } from '@/components/ui/Separator';
import { Typography } from '@/components/ui/Typography';
import { SORT_OPTIONS } from '../../constants';
import { usePatioFilters } from '../../../../hooks/usePatioFilters';
import libraryToolbarStyles from '../../../LibraryToolbar/styles.module.css';
import s from './styles.module.css';

export const PatioSortDrawer: React.FC = () => {
    const { filters, setSort, resetSort, hasActiveSort } = usePatioFilters();

    const [open, setOpen] = React.useState(false);

    const handleSelect = (value: SortKey) => {
        setSort(value);
        setOpen(false);
    };

    const handleReset = () => {
        resetSort();
        setOpen(false);
    };

    return (
        <Drawer.Root open={open} onOpenChange={setOpen}>
            <span className={libraryToolbarStyles['trigger-wrap']}>
                <Drawer.Trigger
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
            <Drawer.Portal>
                <Drawer.Backdrop />
                <Drawer.Viewport>
                    <Drawer.Popup>
                        <Drawer.Content>
                            <Drawer.Header>
                                <Drawer.Title render={<Typography variant="text-xs" />}>Sort by:</Drawer.Title>
                                <Drawer.Close
                                    className={clsx(s.cta, s.close)}
                                    render={
                                        <Button isIcon variant="surface" size="sm" aria-label="Close sort">
                                            <CloseIcon />
                                        </Button>
                                    }
                                />
                            </Drawer.Header>
                            <Separator className={s.separator} orientation="horizontal" />
                            <Drawer.Body className={s.list}>
                                {SORT_OPTIONS.map(({ value, label, Icon }) => {
                                    const isActive = filters.sort === value;

                                    return (
                                        <OptionItem
                                            key={value}
                                            className={s.item}
                                            variant="surface"
                                            data-checked={isActive || undefined}
                                            onClick={() => {
                                                return handleSelect(value);
                                            }}
                                        >
                                            <Icon className={s.icon} />
                                            <Typography variant="text-sm" className={s.label}>
                                                {label}
                                            </Typography>
                                        </OptionItem>
                                    );
                                })}
                            </Drawer.Body>
                            <Drawer.Footer>
                                <Button
                                    className={clsx(s.cta, s.reset)}
                                    variant="link"
                                    size="lg"
                                    onClick={handleReset}
                                    disabled={!hasActiveSort}
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
