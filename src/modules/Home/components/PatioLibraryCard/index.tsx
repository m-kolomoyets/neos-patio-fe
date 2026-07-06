import type { PatioLibraryCardProps } from './types';
import Id24Icon from '@/icons/id_24.svg?react';
import MapPin24Icon from '@/icons/map-pin_24.svg?react';
import clsx from 'clsx';
import { usePatioTransitionNavigate } from '@/hooks/usePatioTransitionNavigate';
import { useSpotlight } from '@/hooks/useSpotlight';
import { Typography } from '@/components/ui/Typography';
import { CONTINENT_LABELS } from '../../constants';
import { useDownscaledImage } from './hooks/useDownscaledImage';
import s from './styles.module.css';

export const PatioLibraryCard: React.FC<PatioLibraryCardProps> = ({ patio }) => {
    const { navigateToPatio: navigate } = usePatioTransitionNavigate();
    const spotlightRef = useSpotlight<HTMLElement>();
    const { canvasRef } = useDownscaledImage({
        url: patio.previewHighUrl,
        lowUrl: patio.previewLowUrl,
        alt: patio.name,
    });

    const navigateToPatio = () => {
        navigate(patio);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            navigateToPatio();
        }
    };

    return (
        <article
            ref={spotlightRef}
            className={clsx(s.wrap, 'focus-primary')}
            data-card-id={patio.id}
            role="button"
            tabIndex={0}
            onClick={navigateToPatio}
            onKeyDown={handleKeyDown}
        >
            <div className={s.media}>
                <div className={clsx(s.decor, s.top)} aria-hidden />
                <div className={clsx(s.decor, s.bottom)} aria-hidden />
                <canvas ref={canvasRef} className={s.image} />
            </div>
            <div className={s.body}>
                <header className={s.top}>
                    <div className={s['title-wrap']}>
                        <Typography variant="text-sm" className={s.name} title={patio.name} render={<h3 />}>
                            {patio.name}
                        </Typography>
                    </div>

                    <Typography className={s.id} variant="text-sm" render={<p />}>
                        <Id24Icon className={s.icon} aria-label="ID" /> {patio.id}
                    </Typography>
                </header>
                <footer className={s.footer}>
                    <Typography variant="text-sm" className={clsx(s.country, 'truncate')} render={<p />}>
                        <MapPin24Icon className={s.icon} aria-hidden />
                        <span className="sr-only">Continent: </span>
                        {CONTINENT_LABELS?.[patio.continent] ?? 'N/A'}
                    </Typography>
                </footer>
            </div>
        </article>
    );
};
