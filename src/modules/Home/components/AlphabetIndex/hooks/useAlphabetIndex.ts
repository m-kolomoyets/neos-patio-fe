import type { PatioLettersFilters } from '@/services/patios/queryKeys';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPatioLettersQueryOptions } from '@/services/patios/queries';
import { HOME_SCROLL_ROOT_SELECTOR } from '../../../constants';
import { ALPHABET, SCROLL_SUPPRESS_MS } from '../constants';

const prefersReducedMotion = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export type UseAlphabetIndexResult = {
    letters: readonly string[];
    enabledLetters: Set<string>;
    activeLetter: string | null;
    isLoading: boolean;
    scrollToLetter: (_letter: string) => void;
};

export const useAlphabetIndex = (filters: PatioLettersFilters): UseAlphabetIndexResult => {
    const { data, isLoading } = useQuery(getPatioLettersQueryOptions(filters));

    const enabledLetters = useMemo(() => {
        return new Set(data ?? []);
    }, [data]);

    const [activeLetter, setActiveLetter] = useState<string | null>(null);
    const suppressUntilRef = useRef(0);

    useEffect(() => {
        const root = document.querySelector(HOME_SCROLL_ROOT_SELECTOR);
        if (!root) return;

        const sections = root.querySelectorAll<HTMLElement>('[data-letter]');
        if (sections.length === 0) return;

        const visible = new Map<string, IntersectionObserverEntry>();

        const observer = new IntersectionObserver(
            (entries) => {
                if (Date.now() < suppressUntilRef.current) return;

                for (const entry of entries) {
                    const letter = (entry.target as HTMLElement).dataset.letter;
                    if (!letter) continue;
                    if (entry.isIntersecting) {
                        visible.set(letter, entry);
                    } else {
                        visible.delete(letter);
                    }
                }

                if (visible.size === 0) return;

                let topmost: { letter: string; top: number } | null = null;
                for (const [letter, entry] of visible) {
                    const top = entry.boundingClientRect.top;
                    if (!topmost || top < topmost.top) {
                        topmost = { letter, top };
                    }
                }
                if (topmost) {
                    setActiveLetter(topmost.letter);
                }
            },
            {
                root,
                rootMargin: '0px 0px -60% 0px',
                threshold: 0,
            }
        );

        for (const section of sections) {
            observer.observe(section);
        }

        return () => {
            observer.disconnect();
        };
    }, [data]);

    const scrollToLetter = useCallback((letter: string) => {
        const root = document.querySelector(HOME_SCROLL_ROOT_SELECTOR);
        const target = root?.querySelector<HTMLElement>(`[data-letter="${CSS.escape(letter)}"]`);
        if (!target) return;

        suppressUntilRef.current = Date.now() + SCROLL_SUPPRESS_MS;
        setActiveLetter(letter);
        target.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'start',
        });
    }, []);

    return {
        letters: ALPHABET,
        enabledLetters,
        activeLetter,
        isLoading,
        scrollToLetter,
    };
};
