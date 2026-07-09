import { useEffect } from 'react';
import { usePageTransition } from '@/contexts/PageTransitionContext';
import HomeIcon from '@/icons/home_24.svg?react';
import { Link } from '@tanstack/react-router';
import { AppBackground } from '@/components/AppBackground';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

export const NotFound: React.FC = () => {
    const { finish } = usePageTransition();

    // Clear the page-transition overlay so this state is visible instead of a
    // stuck spinner when a gated route throws `notFound()` during navigation.
    useEffect(() => {
        finish();
    }, [finish]);

    return (
        <div className={s.root}>
            <AppBackground src="/images/bg-secondary.webp" />
            <div className={s.card}>
                <Typography className={s.code} variant="display-xl" render={<h1 />}>
                    404
                </Typography>
                <Typography className={s.title} variant="text-lg">
                    Oops! The page you&apos;re looking for doesn&apos;t exist.
                </Typography>
                <Button variant="brand" size="xl" nativeButton={false} render={<Link to="/" />}>
                    <HomeIcon />
                    Back to home
                </Button>
            </div>
        </div>
    );
};
