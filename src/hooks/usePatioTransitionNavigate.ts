import type { Patio } from '@/services/patios/types';
import { useCallback, useMemo } from 'react';
import { usePageTransition } from '@/contexts/PageTransitionContext';
import { useNavigate } from '@tanstack/react-router';

type PatioSeed = Pick<Patio, 'id' | 'name' | 'previewBackgroundUrl' | 'previewBackgroundLowUrl'>;

/**
 * Triggers the patio loading overlay for both Home entry points, so the trigger
 * payload (preview background + name) lives in one place.
 *
 * - `seed` only shows the overlay — use it on a `<Link>`, which does its own
 *   navigation (and keeps hover preload / anchor semantics).
 * - `navigateToPatio` shows the overlay and navigates — use it for programmatic
 *   navigation (cards that are not anchors).
 */
export const usePatioTransitionNavigate = () => {
    const navigate = useNavigate();
    const { start } = usePageTransition();

    const seed = useCallback(
        (patio: PatioSeed) => {
            start({
                backgroundUrl: patio.previewBackgroundUrl,
                backgroundLowUrl: patio.previewBackgroundLowUrl,
                name: patio.name,
            });
        },
        [start]
    );

    const navigateToPatio = useCallback(
        (patio: PatioSeed) => {
            seed(patio);
            void navigate({ to: '/patios/$id', params: { id: patio.id } });
        },
        [seed, navigate]
    );

    return useMemo(() => {
        return { seed, navigateToPatio };
    }, [seed, navigateToPatio]);
};
