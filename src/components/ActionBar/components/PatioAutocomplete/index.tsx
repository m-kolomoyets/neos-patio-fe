'use mo memo';

import type { PatioAutocompleteProps } from './types';
import React from 'react';
import SearchIcon from '@/icons/search_24.svg?react';
import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';
import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import { Input } from '@/components/ui/Input';
import { PopupWrapper } from '@/components/ui/PopupWrapper';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Typography } from '@/components/ui/Typography';
import { ROW_GAP, ROW_HEIGHT } from './constants';
import { PatioAutocompleteOptionItem } from './components/PatioAutocompleteOptionItem';
import s from './styles.module.css';

export const PatioAutocomplete: React.FC<PatioAutocompleteProps> = ({
    searchValue,
    options,
    isLoading = false,
    isError = false,
    loadingLabel = 'Loading…',
    errorLabel = 'Something went wrong',
    emptyLabel = 'No results',
    placeholder,
    disabled,
    className,
    onSearchValueChange,
    onOptionSelect,
}) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const [open, setOpen] = React.useState(false);

    const filteredOptions = React.useMemo(() => {
        const needle = searchValue.trim().toLowerCase();

        if (!needle) {
            return options;
        }

        return options.filter((option) => {
            return option.name.toLowerCase().includes(needle);
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
        getItemKey(index) {
            return filteredOptions[index]?.id ?? index;
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
            onOpenChange={(open) => {
                setOpen(open);
                if (open) {
                    requestAnimationFrame(() => {
                        virtualizer.measure();
                    });
                }
            }}
        >
            <BaseAutocomplete.Input
                render={
                    <Input
                        className={s.input}
                        id="patio-autocomplete-input"
                        type="search"
                        leftAddon={<SearchIcon aria-hidden />}
                        wrapperRef={wrapperRef}
                        size="xl"
                        variant="surface"
                        isRounded
                    />
                }
                placeholder={placeholder}
                className={className}
                disabled={disabled}
            />
            <BaseAutocomplete.Portal>
                <BaseAutocomplete.Positioner
                    className={s.positioner}
                    sideOffset={8}
                    align="start"
                    side="top"
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
                                            return (
                                                <PatioAutocompleteOptionItem
                                                    key={option.id}
                                                    className={s.row}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: `${virtualRow.size}px`,
                                                        transform: `translateY(${virtualRow.start}px)`,
                                                    }}
                                                    name={option.name}
                                                    country={option.country}
                                                    render={
                                                        <BaseAutocomplete.Item
                                                            value={option.id}
                                                            index={virtualRow.index}
                                                            onClick={() => {
                                                                onOptionSelect(option);
                                                                onSearchValueChange('');
                                                            }}
                                                        />
                                                    }
                                                />
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
