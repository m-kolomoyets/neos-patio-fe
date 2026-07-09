import { createFileRoute } from '@tanstack/react-router';
import { queryClient } from '@/lib/@queryClient';
import { getPatioQueryOptions } from '@/services/patios/queries';
import { PatioView } from '@/modules/PatioView';

export const Route = createFileRoute('/patios/$id/')({
    component: PatioView,
    loader({ params }) {
        queryClient.prefetchQuery(getPatioQueryOptions(params.id));
    },
});
