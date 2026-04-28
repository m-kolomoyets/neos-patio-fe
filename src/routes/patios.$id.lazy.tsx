import { createLazyFileRoute } from '@tanstack/react-router';
import { Typography } from '@/components/ui/Typography';

const PatioDetailStub: React.FC = () => {
    return (
        <main style={{ padding: '4rem', minHeight: '100svh' }}>
            <Typography variant="display-md">Patio detail · coming soon</Typography>
        </main>
    );
};

export const Route = createLazyFileRoute('/patios/$id')({
    component: PatioDetailStub,
});
