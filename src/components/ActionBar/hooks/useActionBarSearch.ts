import React from 'react';
import { useDebouncedEffect } from '@react-hookz/web';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { SEARCH_TRIGGER_ID } from '../constants';

export const useActionBarSearch = () => {
    // Route-agnostic: syncs the `q` search param on whatever route hosts the bar.
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as { q?: string };
    const setQ = React.useCallback(
        (value: string) => {
            navigate({
                to: '.',
                search: (prev: Record<string, unknown>) => {
                    return { ...prev, q: value.trim() ? value : undefined };
                },
                replace: true,
            });
        },
        [navigate]
    );
    const [isSearchOpened, setIsSearchOpened] = React.useState(false);
    const [query, setQuery] = React.useState(search.q ?? '');
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
