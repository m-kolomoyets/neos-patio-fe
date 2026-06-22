import type { ErrorRouteComponent } from '@tanstack/react-router';
import { useEffect } from 'react';
import { usePageTransition } from '@/contexts/PageTransitionContext';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';

export const ErrorFallback: ErrorRouteComponent = ({ error, reset }) => {
    const { finish } = usePageTransition();

    // A route error (e.g. the patio query failed) means the loading overlay must
    // clear so this error UI is visible instead of a stuck spinner.
    useEffect(() => {
        finish();
    }, [finish]);

    return (
        <div>
            <Typography variant="text-xl">{error.message}</Typography>
            <Button onClick={reset}>Reset</Button>
        </div>
    );
};
