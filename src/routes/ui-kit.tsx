import { createFileRoute } from '@tanstack/react-router';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { assertFeatureEnabled } from '@/lib/utils/assertFeatureEnabled';

export const Route = createFileRoute('/ui-kit')({
    beforeLoad() {
        assertFeatureEnabled(FEATURE_FLAGS.uiKit);
    },
});
