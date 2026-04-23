import { createLazyFileRoute } from '@tanstack/react-router';
import { UiKit } from '@/modules/UiKit';

export const Route = createLazyFileRoute('/ui-kit')({
    component: UiKit,
});
