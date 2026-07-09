'use mo memo';

import type { LabelValueOption } from '@/lib/types';
import type { AutocompleteProps } from './types';
import React from 'react';
import SearchIcon from '@/icons/search_24.svg?react';
import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';
import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import { ROW_GAP, ROW_HEIGHT } from './constants';
import { Input } from '../Input';
import { OptionItem } from '../OptionItem';
import { PopupWrapper } from '../PopupWrapper';
import { ScrollArea } from '../ScrollArea';
import { Typography } from '../Typography';
import s from './styles.module.css';

export const Autocomplete: React.FC<AutocompleteProps> = ({
    value,
    onValueChange,
    searchValue,
    onSearchValueChange,
    options,
    isLoading = false,
    isError = false,
    loadingLabel = 'Loading…',
    errorLabel = 'Something went wrong',
    emptyLabel = 'No results',
    placeholder,
    disabled,
    className,
    size,
    isRounded,
}) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const [open, setOpen] = React.useState(false);

    const filteredOptions = React.useMemo<LabelValueOption[]>(() => {
        const needle = searchValue.trim().toLowerCase();

        if (!needle) {
            return options;
        }

        return options.filter((option) => {
            return option.label.toLowerCase().includes(needle);
        });
    }, [options, searchValue]);

    const virtualizer = useVirtualizer({
        count: filteredOptions.length,
        getScrollElement: () => {
            return scrollRef.current;
        },
        estimateSize: () => {
            return ROW_HEIGHT + ROW_GAP;
        },
        overscan: 5,
        getItemKey: (index) => {
            return filteredOptions[index]?.value ?? index;
        },
    });

    const showError = isError;
    const showLoading = !showError && isLoading;
    const showEmpty = !showError && !showLoading && filteredOptions.length === 0;
    const showList = !showError && !showLoading && !showEmpty;

    React.useEffect(() => {
        virtualizer.scrollToIndex(0);
    }, [searchValue, virtualizer]);

    return (
        <BaseAutocomplete.Root
            mode="none"
            value={searchValue}
            onValueChange={(next) => {
                return onSearchValueChange(next);
            }}
            virtualized
            items={filteredOptions}
            disabled={disabled}
            open={open}
            onOpenChange={setOpen}
        >
            <BaseAutocomplete.Input
                render={
                    <Input
                        type="search"
                        leftAddon={<SearchIcon aria-hidden />}
                        wrapperRef={wrapperRef}
                        size={size}
                        isRounded={isRounded}
                    />
                }
                placeholder={placeholder}
                className={className}
                disabled={disabled}
                onFocus={() => {
                    setOpen(true);
                    requestAnimationFrame(() => {
                        virtualizer.measure();
                    });
                }}
            />
            <BaseAutocomplete.Portal>
                <BaseAutocomplete.Positioner
                    className={s.positioner}
                    sideOffset={8}
                    align="start"
                    side="bottom"
                    anchor={wrapperRef}
                >
                    <BaseAutocomplete.Popup render={<PopupWrapper />} className={s.popup}>
                        {showError ? (
                            <Typography variant="text-sm" className={clsx(s.state, s.error)}>
                                {errorLabel}
                            </Typography>
                        ) : null}
                        {showLoading ? (
                            <Typography variant="text-sm" className={s.state}>
                                {loadingLabel}
                            </Typography>
                        ) : null}
                        {showEmpty ? (
                            <Typography variant="text-sm" className={s.state}>
                                {emptyLabel}
                            </Typography>
                        ) : null}
                        {showList ? (
                            <BaseAutocomplete.List className={s.list}>
                                <ScrollArea
                                    viewportRef={scrollRef}
                                    className={s['scroll-area']}
                                    viewportClassName={s['scroll-area-viewport']}
                                >
                                    <div
                                        style={{
                                            position: 'relative',
                                            width: '100%',
                                            height: `${virtualizer.getTotalSize()}px`,
                                        }}
                                    >
                                        {virtualizer.getVirtualItems().map((virtualRow) => {
                                            const option = filteredOptions[virtualRow.index];
                                            if (!option) return null;
                                            const OptionIcon = option.Icon;
                                            return (
                                                <OptionItem
                                                    key={option.value}
                                                    className={s.row}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: `${virtualRow.size}px`,
                                                        transform: `translateY(${virtualRow.start}px)`,
                                                    }}
                                                    checked={option.value === value}
                                                    leftAddon={
                                                        OptionIcon ? (
                                                            <OptionIcon className={s['option-icon']} aria-hidden />
                                                        ) : null
                                                    }
                                                    render={
                                                        <BaseAutocomplete.Item
                                                            value={option.value}
                                                            index={virtualRow.index}
                                                            onClick={() => {
                                                                onValueChange?.(option.value);
                                                                onSearchValueChange('');
                                                            }}
                                                        />
                                                    }
                                                >
                                                    {option.label}
                                                </OptionItem>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </BaseAutocomplete.List>
                        ) : null}
                    </BaseAutocomplete.Popup>
                </BaseAutocomplete.Positioner>
            </BaseAutocomplete.Portal>
        </BaseAutocomplete.Root>
    );
};
