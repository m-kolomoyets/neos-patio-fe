'use no memo';

import type { GeocodingFeature } from '@/services/geocoding/types';
import React from 'react';
import LocationIcon from '@/icons/location_24.svg?react';
import SearchIcon from '@/icons/search_24.svg?react';
import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';
import { useDebouncedEffect } from '@react-hookz/web';
import clsx from 'clsx';
import { useMap } from 'react-map-gl/mapbox';
import { useGeocodingSearch } from '@/services/geocoding/queries';
import { Input } from '@/components/ui/Input';
import { OptionItem } from '@/components/ui/OptionItem';
import { PopupWrapper } from '@/components/ui/PopupWrapper';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Typography } from '@/components/ui/Typography';
import { CREATE_PATIO_MAP_ID, DEFAULT_ZOOM } from '../../../../constants';
import s from './styles.module.css';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Always-visible place search in the header. Debounces the input, queries the
 * Mapbox geocoding service, and flies the map to a picked result at street-level
 * zoom. It does not change the screen mode.
 */
export const GeocoderSearch: React.FC = () => {
    const maps = useMap();
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [debouncedQuery, setDebouncedQuery] = React.useState('');

    useDebouncedEffect(
        () => {
            setDebouncedQuery(query);
        },
        [query],
        SEARCH_DEBOUNCE_MS
    );

    const { data, isFetching, isError } = useGeocodingSearch({ q: debouncedQuery });
    const options = data ?? [];

    const hasQuery = debouncedQuery.trim().length > 0;
    const showError = isError && hasQuery;
    const showLoading = !showError && isFetching && hasQuery;
    const showEmpty = !showError && !showLoading && hasQuery && options.length === 0;
    const showList = !showError && !showLoading && options.length > 0;

    const flyTo = (feature: GeocodingFeature) => {
        const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];
        if (!mapRef) return;

        mapRef.getMap().flyTo({
            center: [feature.center.longitude, feature.center.latitude],
            zoom: DEFAULT_ZOOM,
        });
    };

    return (
        <BaseAutocomplete.Root
            mode="none"
            value={query}
            onValueChange={setQuery}
            items={options}
            open={open && hasQuery}
            onOpenChange={setOpen}
        >
            <BaseAutocomplete.Input
                render={
                    <Input
                        className={s.input}
                        id="geocoder-search-input"
                        type="search"
                        leftAddon={<SearchIcon aria-hidden />}
                        wrapperRef={wrapperRef}
                        size="md"
                        variant="surface"
                        isRounded
                    />
                }
                placeholder="Search location"
            />
            <BaseAutocomplete.Portal>
                <BaseAutocomplete.Positioner
                    className={s.positioner}
                    sideOffset={8}
                    align="end"
                    side="bottom"
                    anchor={wrapperRef}
                >
                    <BaseAutocomplete.Popup render={<PopupWrapper />} className={s.popup}>
                        {showError ? (
                            <Typography variant="text-sm" className={clsx(s.state, s.error)}>
                                Something went wrong
                            </Typography>
                        ) : null}
                        {showLoading ? (
                            <Typography variant="text-sm" className={s.state}>
                                Loading…
                            </Typography>
                        ) : null}
                        {showEmpty ? (
                            <Typography variant="text-sm" className={s.state}>
                                No places found
                            </Typography>
                        ) : null}
                        {showList ? (
                            <BaseAutocomplete.List className={s.list}>
                                <ScrollArea viewportRef={scrollRef} className={s['scroll-area']}>
                                    {options.map((option, index) => {
                                        return (
                                            <BaseAutocomplete.Item
                                                key={option.id}
                                                className={s.row}
                                                value={option.id}
                                                index={index}
                                                render={
                                                    <OptionItem
                                                        variant="surface"
                                                        leftAddon={<LocationIcon aria-hidden />}
                                                    />
                                                }
                                                onClick={() => {
                                                    flyTo(option);
                                                    setQuery('');
                                                    setOpen(false);
                                                }}
                                            >
                                                {option.name}
                                            </BaseAutocomplete.Item>
                                        );
                                    })}
                                </ScrollArea>
                            </BaseAutocomplete.List>
                        ) : null}
                    </BaseAutocomplete.Popup>
                </BaseAutocomplete.Positioner>
            </BaseAutocomplete.Portal>
        </BaseAutocomplete.Root>
    );
};
