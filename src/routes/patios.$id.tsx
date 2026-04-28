import { createFileRoute } from '@tanstack/react-router';
import { noopReturnNull } from '@/lib/utils/noopReturnNull';

export const Route = createFileRoute('/patios/$id')({
    component: noopReturnNull,
});
