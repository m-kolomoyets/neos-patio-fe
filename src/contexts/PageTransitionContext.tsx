import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from '@tanstack/react-router';

/** Background image + label payload that populates the loading overlay. */
export type PageTransitionPayload = {
    backgroundUrl?: string;
    /** Low-res placeholder shown instantly while `backgroundUrl` loads. */
    backgroundLowUrl?: string;
    name?: string;
};

type PageTransitionContextValue = {
    /** Whether the loading overlay is shown. */
    active: boolean;
    /** Full-bleed background image, if known. */
    backgroundUrl?: string;
    /** Low-res placeholder shown until the full background loads. */
    backgroundLowUrl?: string;
    /** Patio name shown as `Loading {name}`, if known. */
    name?: string;
    /** Show the overlay. Payload is optional so deep-links can start bare. */
    start: (_payload?: PageTransitionPayload) => void;
    /** Swap in background/name after they become known (e.g. query resolved). */
    update: (_payload: PageTransitionPayload) => void;
    /** Begin fade-out and reset. Respects the minimum display time. */
    finish: () => void;
};

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null);

/** Minimum time the overlay stays visible so a fast resolve never flickers. */
const MIN_DISPLAY_MS = 600;

/**
 * Matches the patio routes that get the loading transition: the read-only view
 * index `/patios/$slug/` and the editor `/patios/$slug/edit`.
 */
const PATIO_PATH_RE = /^\/patios\/[^/]+(?:\/edit)?\/?$/;

/**
 * Single source of truth for the patio loading overlay. Lives at the root route
 * so the overlay survives the route swap: it spans both the route's data-loading
 * phase and the mounted editor while the Cesium map streams its first tiles.
 */
export const PageTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const router = useRouter();

    // Deep-link / hard-refresh: landing directly on a patio route activates the
    // overlay synchronously on first render (bare — background + name swap in
    // once the query resolves), so the route's suspense window never flashes
    // blank. Computed once via lazy init; Home navigations seed the overlay via
    // the navigate helper instead.
    const [active, setActive] = useState(() => {
        return PATIO_PATH_RE.test(router.state.location.pathname);
    });
    const [backgroundUrl, setBackgroundUrl] = useState<string | undefined>(undefined);
    const [backgroundLowUrl, setBackgroundLowUrl] = useState<string | undefined>(undefined);
    const [name, setName] = useState<string | undefined>(undefined);

    // Seeded by start(); 0 means "no min-display floor" — fine for the deep-link
    // self-activation, which always waits seconds for the map to settle.
    const startedAtRef = useRef(0);
    const minDisplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearMinDisplayTimer = useCallback(() => {
        if (minDisplayTimerRef.current !== null) {
            clearTimeout(minDisplayTimerRef.current);
            minDisplayTimerRef.current = null;
        }
    }, []);

    const start = useCallback(
        (payload?: PageTransitionPayload) => {
            clearMinDisplayTimer();
            startedAtRef.current = Date.now();
            setBackgroundUrl(payload?.backgroundUrl);
            setBackgroundLowUrl(payload?.backgroundLowUrl);
            setName(payload?.name);
            setActive(true);
        },
        [clearMinDisplayTimer]
    );

    const update = useCallback((payload: PageTransitionPayload) => {
        if (payload.backgroundUrl !== undefined) {
            setBackgroundUrl(payload.backgroundUrl);
        }
        if (payload.backgroundLowUrl !== undefined) {
            setBackgroundLowUrl(payload.backgroundLowUrl);
        }
        if (payload.name !== undefined) {
            setName(payload.name);
        }
    }, []);

    const finish = useCallback(() => {
        const elapsed = Date.now() - startedAtRef.current;
        const remaining = MIN_DISPLAY_MS - elapsed;

        clearMinDisplayTimer();

        if (remaining > 0) {
            minDisplayTimerRef.current = setTimeout(() => {
                minDisplayTimerRef.current = null;
                setActive(false);
            }, remaining);
            return;
        }

        setActive(false);
    }, [clearMinDisplayTimer]);

    // Navigate-away guard: if the user leaves the patio route before the overlay
    // finishes (e.g. browser back mid-load), clear it immediately — no fade-out
    // floor, no lingering pending timeout on the next page.
    useEffect(() => {
        const unsubscribe = router.subscribe('onResolved', ({ toLocation }) => {
            if (!PATIO_PATH_RE.test(toLocation.pathname)) {
                clearMinDisplayTimer();
                setActive(false);
            }
        });

        return unsubscribe;
    }, [router, clearMinDisplayTimer]);

    const value = useMemo<PageTransitionContextValue>(() => {
        return { active, backgroundUrl, backgroundLowUrl, name, start, update, finish };
    }, [active, backgroundUrl, backgroundLowUrl, name, start, update, finish]);

    return <PageTransitionContext value={value}>{children}</PageTransitionContext>;
};

/** Access the loading-overlay controls. Must be used within a PageTransitionProvider. */
export const usePageTransition = (): PageTransitionContextValue => {
    const ctx = useContext(PageTransitionContext);

    if (!ctx) {
        throw new Error('usePageTransition must be used within a PageTransitionProvider');
    }

    return ctx;
};
