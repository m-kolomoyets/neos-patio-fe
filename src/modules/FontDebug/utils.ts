import { FONT_WEIGHT_TOKEN_PREFIX } from './constants';

export type FontDebugStoredState = {
    collapsed: boolean;
    values: Record<string, string>;
};

const collectFromRules = (rules: CSSRuleList, names: Set<string>) => {
    for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule) {
            if (!rule.selectorText.includes(':root')) {
                continue;
            }

            for (const property of Array.from(rule.style)) {
                if (property.startsWith(FONT_WEIGHT_TOKEN_PREFIX)) {
                    names.add(property);
                }
            }

            continue;
        }

        // `@media` / `@supports` wrappers may hold `:root` blocks too.
        if (rule instanceof CSSGroupingRule) {
            collectFromRules(rule.cssRules, names);
        }
    }
};

/**
 * Walks the loaded stylesheets and returns every `--fw-*` custom property declared on a
 * `:root` rule, in declaration order (regular → bold), deduped across the base and the
 * `[data-os="windows"]` blocks.
 */
export const scanFontWeightTokenNames = (): string[] => {
    const names = new Set<string>();

    for (const sheet of Array.from(document.styleSheets)) {
        try {
            collectFromRules(sheet.cssRules, names);
        } catch {
            // Cross-origin stylesheet — `cssRules` is not readable, nothing to collect.
        }
    }

    return Array.from(names);
};

/** Resolved value of a token, honouring whichever `:root` block currently wins. */
export const readTokenValue = (name: string): string => {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

export const isWindows = (): boolean => {
    return document.documentElement.dataset.os === 'windows';
};

const getStorageKey = (): string => {
    return `font-debug:${isWindows() ? 'windows' : 'base'}`;
};

export const loadStoredState = (): FontDebugStoredState | null => {
    try {
        const raw = localStorage.getItem(getStorageKey());

        if (!raw) {
            return null;
        }

        const parsed: unknown = JSON.parse(raw);

        if (typeof parsed !== 'object' || parsed === null) {
            return null;
        }

        const { collapsed, values } = parsed as Partial<FontDebugStoredState>;

        return {
            collapsed: collapsed === true,
            values: typeof values === 'object' && values !== null ? values : {},
        };
    } catch {
        return null;
    }
};

export const saveStoredState = (state: FontDebugStoredState) => {
    try {
        localStorage.setItem(getStorageKey(), JSON.stringify(state));
    } catch {
        // Storage disabled or full — overrides still apply for this session.
    }
};

/**
 * Full replacement block for the matching selector in `src/styles/index.css`,
 * so the copied CSS can be pasted over the existing declarations as-is.
 */
export const buildCssBlock = (names: string[], resolve: (_name: string) => string): string => {
    const selector = isWindows() ? ':root[data-os="windows"]' : ':root';
    const declarations = names.map((name) => {
        return `    ${name}: ${resolve(name)};`;
    });

    return `${selector} {\n${declarations.join('\n')}\n}`;
};
