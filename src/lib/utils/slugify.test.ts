import { describe, expect, it } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
    it('joins multi-word ASCII names with hyphens', () => {
        expect(slugify('Mont Saint Michel')).toBe('mont-saint-michel');
    });

    it('lowercases mixed-case input', () => {
        expect(slugify('MoNT SaInt MICHEL')).toBe('mont-saint-michel');
    });

    it.each([
        ['Sagrada Família', 'sagrada-familia'],
        ['Tōdai-ji', 'todai-ji'],
        ['Château de Chambord', 'chateau-de-chambord'],
        ['Angkor Ẃat', 'angkor-wat'],
    ])('folds combining diacritics: %s', (name, expected) => {
        expect(slugify(name)).toBe(expected);
    });

    it.each([
        ['København', 'kobenhavn'],
        ['Ærøskøbing', 'aeroskobing'],
        ['Straße des 17. Juni', 'strasse-des-17-juni'],
        ['Łazienki Park', 'lazienki-park'],
        ['Đakovo', 'dakovo'],
        ['Þingvellir', 'thingvellir'],
        ['Œuvre Notre Dame', 'oeuvre-notre-dame'],
        ['Ðuro', 'duro'],
    ])('transliterates characters NFD cannot decompose: %s', (name, expected) => {
        expect(slugify(name)).toBe(expected);
    });

    it('removes apostrophes and periods rather than turning them into separators', () => {
        expect(slugify(`St. Basil's`)).toBe('st-basils');
        expect(slugify('St. Basil’s Cathedral')).toBe('st-basils-cathedral');
    });

    it('collapses punctuation runs into a single hyphen', () => {
        expect(slugify('Ros & Co')).toBe('ros-co');
        expect(slugify('Villa d’Este — Tivoli')).toBe('villa-deste-tivoli');
    });

    it('collapses consecutive separators into one', () => {
        expect(slugify('Casa   Batlló')).toBe('casa-batllo');
        expect(slugify('Casa--Batllo')).toBe('casa-batllo');
    });

    it('leaves no dangling hyphen from leading or trailing punctuation', () => {
        expect(slugify('  —Alhambra!!  ')).toBe('alhambra');
        expect(slugify('***Petra***')).toBe('petra');
    });

    it('is idempotent for already-slug-shaped input', () => {
        expect(slugify('mont-saint-michel')).toBe('mont-saint-michel');
        expect(slugify(slugify('Château de Chambord'))).toBe('chateau-de-chambord');
    });

    it.each([['京都御所'], ['Кремль'], ['!!!'], ['']])(
        'returns the empty string when nothing usable survives: %s',
        (name) => {
            expect(slugify(name)).toBe('');
        }
    );

    it.each([
        ['id5', 'id-5'],
        ['ID 5', 'id-5'],
        ['Id.5', 'id-5'],
        ['id007', 'id-007'],
    ])('never produces the reserved id<digits> form: %s', (name, expected) => {
        expect(slugify(name)).toBe(expected);
    });

    it('leaves id-prefixed names that are not the reserved form untouched', () => {
        expect(slugify('id5a')).toBe('id5a');
        expect(slugify('Idaho 5')).toBe('idaho-5');
    });
});
