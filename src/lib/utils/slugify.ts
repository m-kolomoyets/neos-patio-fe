/**
 * Characters NFD cannot decompose into a base letter plus combining marks — they are
 * distinct letters in Unicode, not accented forms — so they need explicit Latin folds.
 */
const TRANSLITERATIONS: Record<string, string> = {
    ø: 'o',
    æ: 'ae',
    œ: 'oe',
    ß: 'ss',
    ł: 'l',
    đ: 'd',
    þ: 'th',
    ð: 'd',
};

const combiningMarksRegExp = /\p{M}+/gu;

/**
 * Intra-word punctuation is dropped outright rather than collapsed into a hyphen:
 * `St. Basil's` reads as `st-basils`, not `st-basil-s`.
 */
const droppedPunctuationRegExp = /['’‘`´.]+/g;

const transliterableRegExp = new RegExp(`[${Object.keys(TRANSLITERATIONS).join('')}]`, 'g');
const separatorRunRegExp = /[^a-z0-9]+/g;
const edgeHyphensRegExp = /^-+|-+$/g;

/**
 * The `id<digits>` shape is the reserved fallback namespace for patios without a usable
 * name, so a name-derived slug must never be able to take it.
 */
const reservedRefRegExp = /^id(\d+)$/;

/**
 * URL-safe ASCII slug for `name`: accents folded, lowercase, hyphen-separated.
 *
 * Returns the empty string when nothing usable survives (a name written wholly in a
 * non-Latin script, say) — that is the caller's signal to fall back to another ref.
 * There is no length cap: truncation manufactures collisions and buys nothing here.
 */
export const slugify = (name: string): string => {
    const slug = name
        .normalize('NFD')
        .replace(combiningMarksRegExp, '')
        .toLowerCase()
        .replace(transliterableRegExp, (char) => {
            return TRANSLITERATIONS[char];
        })
        .replace(droppedPunctuationRegExp, '')
        .replace(separatorRunRegExp, '-')
        .replace(edgeHyphensRegExp, '');

    return slug.replace(reservedRefRegExp, 'id-$1');
};
