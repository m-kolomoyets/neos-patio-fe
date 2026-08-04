import type { Patio } from '../types';
import { slugify } from '@/lib/utils/slugify';

/**
 * Reserved ref for a patio whose name yields no usable slug. `slugify` guarantees it
 * can never produce this shape, so the namespace cannot be shadowed by a real name.
 */
export const patioFallbackSlug = (id: string): string => {
    return `id${id}`;
};

/** Canonical slug a patio asks for, before collisions are taken into account. */
const preferredSlug = (patio: Patio): string => {
    return patio.slug || slugify(patio.name) || patioFallbackSlug(patio.id);
};

const warnCollision = (slug: string, patio: Patio, resolved: string): void => {
    if (!import.meta.env.DEV) {
        return;
    }
    // eslint-disable-next-line no-console
    console.warn(
        `[patios] Slug "${slug}" is already taken; patio ${patio.id} ("${patio.name}") was reassigned to ` +
            `"${resolved}". Set an explicit \`slug\` on the fixture to pin a stable URL.`
    );
};

/**
 * Builds the slug → patio lookup so resolution is constant-time rather than a linear scan.
 *
 * Owns collision resolution: the first patio to claim a slug keeps it, later ones get a
 * numeric suffix in definition order (`Chambord`, `Chambord_2`). An explicit fixture slug is
 * not exempt — silently overwriting would make one patio unreachable and undebuggable.
 * Collisions are compared case-insensitively, because refs resolve that way: two slugs
 * differing only in case would otherwise leave one patio unreachable.
 *
 * The stored patio carries the slug it was actually indexed under, so `patio.slug` is always
 * the canonical ref. Pure, apart from the development-only collision warning.
 */
export const buildPatioSlugIndex = (patios: Patio[]): Map<string, Patio> => {
    const index = new Map<string, Patio>();
    const taken = new Set<string>();

    patios.forEach((patio) => {
        const preferred = preferredSlug(patio);

        let slug = preferred;
        let suffix = 1;
        while (taken.has(slug.toLowerCase())) {
            suffix += 1;
            slug = `${preferred}_${suffix}`;
        }
        taken.add(slug.toLowerCase());

        if (slug !== preferred) {
            warnCollision(preferred, patio, slug);
        }

        index.set(slug, patio.slug === slug ? patio : { ...patio, slug });
    });

    return index;
};
