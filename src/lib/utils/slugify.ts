/**
 * Characters NFD cannot decompose into a base letter plus combining marks — they are
 * distinct letters in Unicode, not accented forms — so they need explicit Latin folds.
 * Listed in both cases: the slug keeps the name's casing, so folding is case-preserving.
 */
const TRANSLITERATIONS: Record<string, string> = {
    ø: 'o',
    Ø: 'O',
    æ: 'ae',
    Æ: 'Ae',
    œ: 'oe',
    Œ: 'Oe',
    ß: 'ss',
    ẞ: 'Ss',
    ł: 'l',
    Ł: 'L',
    đ: 'd',
    Đ: 'D',
    þ: 'th',
    Þ: 'Th',
    ð: 'd',
    Ð: 'D',
};

const combiningMarksRegExp = /\p{M}+/gu;

/**
 * Intra-word punctuation is dropped outright rather than collapsed into a separator:
 * `St. Basil's` reads as `St_Basils`, not `St_Basil_S`.
 */
const droppedPunctuationRegExp = /['’‘`´.]+/g;

const transliterableRegExp = new RegExp(`[${Object.keys(TRANSLITERATIONS).join('')}]`, 'g');
const wordRegExp = /[a-zA-Z0-9]+/g;

/**
 * The `id<digits>` shape is the reserved fallback namespace for patios without a usable
 * name, so a name-derived slug must never be able to take it. Matched case-insensitively
 * because refs resolve case-insensitively.
 */
const reservedRefRegExp = /^id(\d+)$/i;

/**
 * URL-safe ASCII slug for `name`: accents folded, words capitalised and underscore-joined
 * (`Château de Chambord` → `Chateau_De_Chambord`). Only the first letter of each word is
 * forced — the rest of the name's casing is carried through as written.
 *
 * Returns the empty string when nothing usable survives (a name written wholly in a
 * non-Latin script, say) — that is the caller's signal to fall back to another ref.
 * There is no length cap: truncation manufactures collisions and buys nothing here.
 */
export const slugify = (name: string): string => {
    const words = name
        .normalize('NFD')
        .replace(combiningMarksRegExp, '')
        .replace(transliterableRegExp, (char) => {
            return TRANSLITERATIONS[char];
        })
        .replace(droppedPunctuationRegExp, '')
        .match(wordRegExp);

    if (!words) {
        return '';
    }

    const slug = words
        .map((word) => {
            return word[0].toUpperCase() + word.slice(1);
        })
        .join('_');

    return slug.replace(reservedRefRegExp, 'Id_$1');
};
