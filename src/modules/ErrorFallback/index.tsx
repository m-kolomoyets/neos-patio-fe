import type { ErrorRouteComponent } from '@tanstack/react-router';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';

export const ErrorFallback: ErrorRouteComponent = ({ error, reset }) => {
    return (
        <div>
            <Typography variant="text-xl">{error.message}</Typography>
            <Button onClick={reset}>Reset</Button>
        </div>
    );
};
