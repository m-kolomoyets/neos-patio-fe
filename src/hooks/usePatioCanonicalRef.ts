import type { Patio } from '@/services/patios/types';
import { useEffect } from 'react';
import { notFound } from '@tanstack/react-router';

type UsePatioCanonicalRefOptions = {
    /** The ref exactly as it appears in the URL — a slug, an `id<n>` form, or a bare id. */
    ref: string;
    patio: Patio | null | undefined;
    /**
     * Route-scoped navigation, supplied by the consuming module. Route-scoped so the
     * correction keeps the current sub-route (an editor visit stays in the editor) and
     * carries search params and hash through untouched. Must replace rather than push,
     * so the back button does not return to the non-canonical URL.
     */
    navigateToSlug: (_slug: string) => void;
};

/**
 * Owns both rules for a patio ref taken from the URL, so the view and the editor
 * cannot drift:
 *
 * - An unresolvable ref throws the router's not-found, rendering the root
 *   `notFoundComponent` instead of crashing into the error boundary.
 * - A resolvable but non-canonical ref — a legacy bare id, the reserved `id<n>`
 *   form, or a different capitalisation — corrects the address bar, so the ugly
 *   form never propagates and whatever the user copies next is the right link.
 *
 * Runs after the suspense query resolves, keeping the route loader a non-blocking
 * prefetch and the page-transition timing untouched. Returns the resolved patio so
 * callers get a non-nullable value without repeating the miss check.
 */
export const usePatioCanonicalRef = ({ ref, patio, navigateToSlug }: UsePatioCanonicalRefOptions): Patio => {
    useEffect(
        function correctNonCanonicalRef() {
            if (!patio || patio.slug === ref) {
                return;
            }
            navigateToSlug(patio.slug);
        },
        [ref, patio, navigateToSlug]
    );

    // Thrown during render, after every hook call so hook order stays stable; the
    // nearest not-found boundary (the root route's) catches it.
    if (!patio) {
        throw notFound();
    }

    return patio;
};
