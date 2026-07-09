import { createFileRoute } from '@tanstack/react-router';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { assertFeatureEnabled } from '@/lib/utils/assertFeatureEnabled';

export const Route = createFileRoute('/create-patio')({
    beforeLoad() {
        assertFeatureEnabled(FEATURE_FLAGS.createPatio);
    },
});
