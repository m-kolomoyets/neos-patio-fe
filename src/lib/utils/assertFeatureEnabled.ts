import { notFound } from '@tanstack/react-router';

/**
 * Throws a not-found in a route's `beforeLoad` when its feature flag is off, so
 * a disabled route renders the root `notFoundComponent` on navigate AND on a
 * pasted URL (both run `beforeLoad`), before its lazy chunk is even fetched.
 */
export function assertFeatureEnabled(enabled: boolean): void {
    if (!enabled) {
        throw notFound();
    }
}
