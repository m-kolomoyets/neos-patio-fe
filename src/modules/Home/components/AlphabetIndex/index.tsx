import type { AlphabetIndexProps } from './types';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { usePatioFilters } from '../../hooks/usePatioFilters';
import { useAlphabetIndex } from './hooks/useAlphabetIndex';
import s from './styles.module.css';

const isAlphaMode = (filters: ReturnType<typeof usePatioFilters>['filters']) => {
    return filters.sort === 'name' && !filters.continents?.length;
};

export const AlphabetIndex: React.FC<AlphabetIndexProps> = ({ className }) => {
    const { filters } = usePatioFilters();
    const alpha = isAlphaMode(filters);

    const lettersFilters = useMemo(() => {
        return { q: filters.q, continents: filters.continents, types: filters.types };
    }, [filters.q, filters.continents, filters.types]);

    const { letters, enabledLetters, activeLetter, isLoading, scrollToLetter } = useAlphabetIndex(lettersFilters);

    const buttonsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
    const [focusedLetter, setFocusedLetter] = useState<string | null>(null);

    const enabledList = useMemo(() => {
        return letters.filter((l) => {
            return enabledLetters.has(l);
        });
    }, [letters, enabledLetters]);

    const focusLetter = useCallback((letter: string) => {
        setFocusedLetter(letter);
        const btn = buttonsRef.current.get(letter);
        btn?.focus();
    }, []);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (enabledList.length === 0) return;

            const currentIdx = focusedLetter ? enabledList.indexOf(focusedLetter) : -1;

            switch (event.key) {
                case 'ArrowDown':
                case 'ArrowRight': {
                    event.preventDefault();
                    const next = enabledList[(currentIdx + 1) % enabledList.length];
                    focusLetter(next);
                    return;
                }
                case 'ArrowUp':
                case 'ArrowLeft': {
                    event.preventDefault();
                    const prev = enabledList[(currentIdx - 1 + enabledList.length) % enabledList.length];
                    focusLetter(prev);
                    return;
                }
                case 'Home': {
                    event.preventDefault();
                    focusLetter(enabledList[0]);
                    return;
                }
                case 'End': {
                    event.preventDefault();
                    focusLetter(enabledList[enabledList.length - 1]);
                    return;
                }
            }
        },
        [enabledList, focusedLetter, focusLetter]
    );

    if (!alpha) return null;

    const tabStopLetter = focusedLetter && enabledLetters.has(focusedLetter) ? focusedLetter : enabledList[0];

    return (
        <div
            role="toolbar"
            aria-label="Alphabet index"
            aria-orientation="vertical"
            className={clsx(s.wrap, 'surface-regular', className)}
            onKeyDown={handleKeyDown}
        >
            {letters.map((letter) => {
                const enabled = !isLoading && enabledLetters.has(letter);
                const isActive = activeLetter === letter;
                const isTabStop = letter === tabStopLetter;
                return (
                    <button
                        key={letter}
                        ref={(node) => {
                            if (node) {
                                buttonsRef.current.set(letter, node);
                            } else {
                                buttonsRef.current.delete(letter);
                            }
                        }}
                        type="button"
                        className={clsx(s.letter, 'focus-primary')}
                        data-active={isActive || undefined}
                        disabled={!enabled}
                        tabIndex={enabled && isTabStop ? 0 : -1}
                        aria-current={isActive ? 'true' : undefined}
                        title={`Jump to ${letter}`}
                        onClick={() => {
                            scrollToLetter(letter);
                            setFocusedLetter(letter);
                        }}
                        onFocus={() => {
                            setFocusedLetter(letter);
                        }}
                    >
                        {letter}
                    </button>
                );
            })}
        </div>
    );
};
