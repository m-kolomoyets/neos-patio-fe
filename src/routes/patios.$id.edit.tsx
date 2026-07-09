import { createFileRoute } from '@tanstack/react-router';
import { queryClient } from '@/lib/@queryClient';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { assertFeatureEnabled } from '@/lib/utils/assertFeatureEnabled';
import { getModelsQueryOptions } from '@/services/models/queries';
import { getPatioQueryOptions } from '@/services/patios/queries';
import PatioEditor from '@/modules/PatioEditor';

export const Route = createFileRoute('/patios/$id/edit')({
    component: PatioEditor,
    beforeLoad() {
        assertFeatureEnabled(FEATURE_FLAGS.patioEdit);
    },
    loader({ params }) {
        queryClient.prefetchQuery(getModelsQueryOptions());
        queryClient.prefetchQuery(getPatioQueryOptions(params.id));
    },
});
