import { createFileRoute } from '@tanstack/react-router';
import { queryClient } from '@/lib/@queryClient';
import { noopReturnNull } from '@/lib/utils/noopReturnNull';
import { getModelsQueryOptions } from '@/services/models/queries';
import { getPatioQueryOptions } from '@/services/patios/queries';

export const Route = createFileRoute('/patios/$id')({
    component: noopReturnNull,
    loader({ params }) {
        queryClient.prefetchQuery(getModelsQueryOptions());
        return queryClient.ensureQueryData(getPatioQueryOptions(params.id));
    },
});
