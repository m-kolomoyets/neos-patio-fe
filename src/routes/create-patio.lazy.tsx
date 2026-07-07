import { createLazyFileRoute } from '@tanstack/react-router';
import { CreatePatio } from '@/modules/CreatePatio';

export const Route = createLazyFileRoute('/create-patio')({
    component: CreatePatio,
});
