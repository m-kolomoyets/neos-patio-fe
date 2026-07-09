import type { Continent, Patio } from '@/services/patios/types';
import { CONTINENT_LABELS } from '../constants';

export type PatioGroup = {
    key: string;
    title: string;
    items: Patio[];
};

const stripDiacritics = (input: string) => {
    return input.normalize('NFD').replace(/\p{Diacritic}/gu, '');
};

const firstAlphaLetter = (name: string) => {
    const char = stripDiacritics(name.trim()).charAt(0).toUpperCase();
    return /[A-Z]/.test(char) ? char : '#';
};

export const groupByContinent = (items: Patio[], order: Continent[]): PatioGroup[] => {
    const buckets = new Map<Continent, Patio[]>();
    for (const patio of items) {
        const list = buckets.get(patio.continent);
        if (list) {
            list.push(patio);
        } else {
            buckets.set(patio.continent, [patio]);
        }
    }

    const groups: PatioGroup[] = [];
    for (const continent of order) {
        const list = buckets.get(continent);
        if (list?.length) {
            groups.push({
                key: continent,
                title: CONTINENT_LABELS[continent],
                items: list,
            });
        }
    }
    return groups;
};

export const groupByAlpha = (items: Patio[]): PatioGroup[] => {
    const buckets = new Map<string, Patio[]>();
    for (const patio of items) {
        const letter = firstAlphaLetter(patio.name);
        const list = buckets.get(letter);
        if (list) {
            list.push(patio);
        } else {
            buckets.set(letter, [patio]);
        }
    }

    return Array.from(buckets.entries())
        .sort(([a], [b]) => {
            if (a === '#') return 1;
            if (b === '#') return -1;
            return a.localeCompare(b);
        })
        .map(([letter, list]) => {
            return { key: letter, title: letter, items: list };
        });
};
