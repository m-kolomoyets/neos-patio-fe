import { createLazyFileRoute } from '@tanstack/react-router';
import PatioEditor from '@/modules/PatioEditor';

export const Route = createLazyFileRoute('/patios/$id')({
    component: PatioEditor,
});
