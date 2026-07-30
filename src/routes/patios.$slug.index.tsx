import { createFileRoute } from '@tanstack/react-router';
import { queryClient } from '@/lib/@queryClient';
import { getPatioQueryOptions } from '@/services/patios/queries';
import { PatioView } from '@/modules/PatioView';

export const Route = createFileRoute('/patios/$slug/')({
    component: PatioView,
    // Non-blocking prefetch on purpose: a blocking loader would make navigation
    // wait on the fetch before unmounting the previous route, shifting the
    // page-transition overlay's start-to-reveal timing.
    loader({ params }) {
        queryClient.prefetchQuery(getPatioQueryOptions(params.slug));
    },
});
