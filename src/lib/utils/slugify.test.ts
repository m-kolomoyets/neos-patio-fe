import { describe, expect, it } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
    it('joins multi-word ASCII names with underscores', () => {
        expect(slugify('Mont Saint Michel')).toBe('Mont_Saint_Michel');
    });

    it('capitalises each word without touching the rest of its casing', () => {
        expect(slugify('château de chambord')).toBe('Chateau_De_Chambord');
        expect(slugify('MoNT SaInt MICHEL')).toBe('MoNT_SaInt_MICHEL');
    });

    it.each([
        ['Sagrada Família', 'Sagrada_Familia'],
        ['Tōdai-ji', 'Todai_Ji'],
        ['Château de Chambord', 'Chateau_De_Chambord'],
        ['Angkor Ẃat', 'Angkor_Wat'],
    ])('folds combining diacritics: %s', (name, expected) => {
        expect(slugify(name)).toBe(expected);
    });

    it.each([
        ['København', 'Kobenhavn'],
        ['Ærøskøbing', 'Aeroskobing'],
        ['Straße des 17. Juni', 'Strasse_Des_17_Juni'],
        ['Łazienki Park', 'Lazienki_Park'],
        ['Đakovo', 'Dakovo'],
        ['Þingvellir', 'Thingvellir'],
        ['Œuvre Notre Dame', 'Oeuvre_Notre_Dame'],
        ['Ðuro', 'Duro'],
    ])('transliterates characters NFD cannot decompose: %s', (name, expected) => {
        expect(slugify(name)).toBe(expected);
    });

    it('removes apostrophes and periods rather than turning them into separators', () => {
        expect(slugify(`St. Basil's`)).toBe('St_Basils');
        expect(slugify('St. Basil’s Cathedral')).toBe('St_Basils_Cathedral');
    });

    it('collapses punctuation runs into a single separator', () => {
        expect(slugify('Ros & Co')).toBe('Ros_Co');
        expect(slugify('Villa d’Este — Tivoli')).toBe('Villa_DEste_Tivoli');
    });

    it('collapses consecutive separators into one', () => {
        expect(slugify('Casa   Batlló')).toBe('Casa_Batllo');
        expect(slugify('Casa__Batllo')).toBe('Casa_Batllo');
    });

    it('leaves no dangling separator from leading or trailing punctuation', () => {
        expect(slugify('  —Alhambra!!  ')).toBe('Alhambra');
        expect(slugify('***Petra***')).toBe('Petra');
    });

    it('is idempotent for already-slug-shaped input', () => {
        expect(slugify('Mont_Saint_Michel')).toBe('Mont_Saint_Michel');
        expect(slugify(slugify('Château de Chambord'))).toBe('Chateau_De_Chambord');
    });

    it.each([['京都御所'], ['Кремль'], ['!!!'], ['']])(
        'returns the empty string when nothing usable survives: %s',
        (name) => {
            expect(slugify(name)).toBe('');
        }
    );

    it.each([
        ['id5', 'Id_5'],
        ['ID5', 'Id_5'],
        ['Id.5', 'Id_5'],
        ['id007', 'Id_007'],
    ])('never produces the reserved id<digits> form: %s', (name, expected) => {
        expect(slugify(name)).toBe(expected);
    });

    it('leaves id-prefixed names that are not the reserved form untouched', () => {
        expect(slugify('id5a')).toBe('Id5a');
        expect(slugify('Idaho 5')).toBe('Idaho_5');
    });
});
