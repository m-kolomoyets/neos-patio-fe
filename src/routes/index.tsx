import { createFileRoute } from '@tanstack/react-router';
import { noopReturnNull } from '@/lib/utils/noopReturnNull';
import { homeSearchSchema } from '@/modules/Home/schemas';

export const Route = createFileRoute('/')({
    validateSearch: homeSearchSchema,
    component: noopReturnNull,
});
