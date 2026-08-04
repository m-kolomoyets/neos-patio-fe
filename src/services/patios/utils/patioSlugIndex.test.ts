import type { Patio } from '../types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PATIOS_FIXTURES } from '../fixtures';
import { buildPatioSlugIndex } from './patioSlugIndex';

const makePatio = (overrides: Partial<Patio> & Pick<Patio, 'id' | 'name'>): Patio => {
    return {
        slug: '',
        description: '',
        country: 'France',
        continent: 'europe',
        type: 'landmark',
        author: 'Neos',
        createdAt: '2025-01-01T10:00:00Z',
        popularity: 0,
        coords: { lat: 0, lng: 0 },
        height: 0,
        bounds: [0, 0, 0, 0],
        objects: [],
        isFeatured: false,
        isPublished: false,
        previewHighUrl: '',
        previewBackgroundUrl: '',
        ...overrides,
    };
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('buildPatioSlugIndex', () => {
    it('indexes every patio under its canonical slug', () => {
        const index = buildPatioSlugIndex([
            makePatio({ id: '1', name: 'Mont Saint Michel' }),
            makePatio({ id: '2', name: 'Sagrada Família' }),
        ]);

        expect(index.get('Mont_Saint_Michel')?.id).toBe('1');
        expect(index.get('Sagrada_Familia')?.id).toBe('2');
    });

    it('prefers an explicit slug over the derived one', () => {
        const index = buildPatioSlugIndex([makePatio({ id: '1', name: 'Castillo de Chambord', slug: 'Chambord' })]);

        expect(index.get('Chambord')?.id).toBe('1');
        expect(index.has('Castillo_De_Chambord')).toBe(false);
    });

    it('falls back to the id ref when the name yields no usable slug', () => {
        const index = buildPatioSlugIndex([makePatio({ id: '7', name: '東大寺' })]);

        expect(index.get('id7')?.id).toBe('7');
        expect(index.size).toBe(1);
    });

    it('suffixes the second of two colliding names, keeping both reachable', () => {
        const index = buildPatioSlugIndex([
            makePatio({ id: '1', name: 'Chambord' }),
            makePatio({ id: '2', name: 'Chambord' }),
        ]);

        expect(index.get('Chambord')?.id).toBe('1');
        expect(index.get('Chambord_2')?.id).toBe('2');
    });

    it('increments a three-way collision', () => {
        const index = buildPatioSlugIndex([
            makePatio({ id: '1', name: 'Chambord' }),
            makePatio({ id: '2', name: 'Chambord' }),
            makePatio({ id: '3', name: 'Chambord' }),
        ]);

        expect([...index.keys()]).toEqual(['Chambord', 'Chambord_2', 'Chambord_3']);
    });

    it('dedupes an explicit slug that collides with a derived one', () => {
        const index = buildPatioSlugIndex([
            makePatio({ id: '1', name: 'Chambord' }),
            makePatio({ id: '2', name: 'Somewhere Else', slug: 'Chambord' }),
        ]);

        expect(index.get('Chambord')?.id).toBe('1');
        expect(index.get('Chambord_2')?.id).toBe('2');
    });

    it('treats a case-only difference as a collision, since refs resolve case-insensitively', () => {
        const index = buildPatioSlugIndex([
            makePatio({ id: '1', name: 'Chambord' }),
            makePatio({ id: '2', name: 'Somewhere Else', slug: 'chambord' }),
        ]);

        expect(index.get('Chambord')?.id).toBe('1');
        expect(index.get('chambord_2')?.id).toBe('2');
    });

    it('exposes the reassigned slug on the indexed patio', () => {
        const index = buildPatioSlugIndex([
            makePatio({ id: '1', name: 'Chambord' }),
            makePatio({ id: '2', name: 'Chambord' }),
        ]);

        expect(index.get('Chambord_2')?.slug).toBe('Chambord_2');
    });

    it('warns when a collision is auto-resolved', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        buildPatioSlugIndex([makePatio({ id: '1', name: 'Chambord' }), makePatio({ id: '2', name: 'Chambord' })]);

        expect(warn).toHaveBeenCalledTimes(1);
        const message = String(warn.mock.calls[0]?.[0]);
        expect(message).toContain('Chambord');
        expect(message).toContain('Chambord_2');
        expect(message).toContain('2');
    });

    it('does not warn when there are no collisions', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        buildPatioSlugIndex([
            makePatio({ id: '1', name: 'Chambord' }),
            makePatio({ id: '2', name: 'Mont Saint Michel' }),
        ]);

        expect(warn).not.toHaveBeenCalled();
    });

    it('is stable across repeated builds from the same input', () => {
        const patios = [
            makePatio({ id: '1', name: 'Chambord' }),
            makePatio({ id: '2', name: 'Chambord' }),
            makePatio({ id: '3', name: '東大寺' }),
        ];
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        expect([...buildPatioSlugIndex(patios).keys()]).toEqual([...buildPatioSlugIndex(patios).keys()]);
    });
});

describe('the fixture slug index', () => {
    it('gives all fourteen fixtures a unique, unsuffixed slug', () => {
        const slugs = PATIOS_FIXTURES.map((patio) => {
            return patio.slug;
        });

        expect(slugs).toHaveLength(14);
        expect(new Set(slugs).size).toBe(14);
        expect(
            slugs.filter((slug) => {
                return /_\d+$/.test(slug);
            })
        ).toEqual([]);
    });

    it('reaches every fixture by its canonical slug', () => {
        const index = buildPatioSlugIndex(PATIOS_FIXTURES);

        PATIOS_FIXTURES.forEach((patio) => {
            expect(index.get(patio.slug)).toBe(patio);
        });
    });
});
