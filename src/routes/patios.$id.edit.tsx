import { createFileRoute } from '@tanstack/react-router';
import { queryClient } from '@/lib/@queryClient';
import { getModelsQueryOptions } from '@/services/models/queries';
import { getPatioQueryOptions } from '@/services/patios/queries';
import PatioEditor from '@/modules/PatioEditor';

export const Route = createFileRoute('/patios/$id/edit')({
    component: PatioEditor,
    loader({ params }) {
        queryClient.prefetchQuery(getModelsQueryOptions());
        queryClient.prefetchQuery(getPatioQueryOptions(params.id));
    },
});
