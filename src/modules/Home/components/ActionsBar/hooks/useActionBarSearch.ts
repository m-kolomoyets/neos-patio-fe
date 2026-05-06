import React from 'react';
import { useDebouncedEffect } from '@react-hookz/web';
import { SEARCH_TRIGGER_ID } from '../constants';
import { usePatioFilters } from '../../../hooks/usePatioFilters';

export const useActionBarSearch = () => {
    const { filters, setQ } = usePatioFilters();
    const [isSearchOpened, setIsSearchOpened] = React.useState(false);
    const [query, setQuery] = React.useState(filters.q ?? '');
    const wrapRef = React.useRef<HTMLDivElement>(null);

    const openSearch = React.useCallback(() => {
        setIsSearchOpened(true);
        requestAnimationFrame(() => {
            document.getElementById('patio-autocomplete-input')?.focus();
        });
    }, []);

    const closeSearch = React.useCallback(() => {
        setIsSearchOpened(false);
        setQuery('');
        setQ('');
        requestAnimationFrame(() => {
            document.getElementById(SEARCH_TRIGGER_ID)?.focus();
        });
    }, [setQ]);

    useDebouncedEffect(
        () => {
            if (!isSearchOpened) {
                return;
            }
            setQ(query);
        },
        [query, isSearchOpened, setQ],
        300
    );

    React.useEffect(() => {
        if (!isSearchOpened) {
            return;
        }

        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeSearch();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
        };
    }, [isSearchOpened, closeSearch]);

    React.useEffect(() => {
        if (!isSearchOpened) {
            return;
        }

        const onMouseDown = (event: MouseEvent) => {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }
            if (wrapRef.current?.contains(target)) {
                return;
            }
            if (target.closest('[role="listbox"], [role="option"], [data-popup], [data-portal]')) {
                return;
            }
            closeSearch();
        };
        document.addEventListener('mousedown', onMouseDown);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
        };
    }, [isSearchOpened, closeSearch]);

    return {
        isSearchOpened,
        openSearch,
        closeSearch,
        query,
        setQuery,
        wrapRef,
    };
};
