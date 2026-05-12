import type { Patio } from '@/services/patios/types';
import ArrowTopRight24Icon from '@/icons/arrow-top-right_24.svg?react';
import MapPinIcon from '@/icons/map-pin_24.svg?react';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { DepthImage } from '@/components/ui/DepthImage';
import { Typography } from '@/components/ui/Typography';
import { useHomeNavigate } from '../../hooks/useHomeRouteApi';
import s from './styles.module.css';

type Props = {
    patio: Patio;
};

export const PatioLibraryCard: React.FC<Props> = ({ patio }) => {
    const navigate = useHomeNavigate();

    const navigateToPatio = () => {
        navigate({
            to: '/patios/$id',
            params: {
                id: patio.id,
            },
        });
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            navigateToPatio();
        }
    };

    return (
        <article
            className={s.wrap}
            data-card-id={patio.id}
            role="button"
            onClick={navigateToPatio}
            onKeyDown={handleKeyDown}
        >
            <div className={s.media}>
                {/* <img className={s.image} src={patio.previewHighUrl} alt={patio.name} loading="lazy" /> */}
                <DepthImage className={s.image} src={patio.previewHighUrl} alt={patio.name} loading="lazy" />
            </div>
            <div className={s.body}>
                <header className={s.top}>
                    <div className={s['title-wrap']}>
                        <Typography
                            variant="text-md"
                            className={clsx(s.name, 'truncate')}
                            title={patio.name}
                            render={<h3 />}
                        >
                            {patio.name}
                        </Typography>
                        <Button
                            className={s.cta}
                            variant="surface"
                            size="sm"
                            isIcon
                            title={`Open ${patio.name}`}
                            nativeButton={false}
                            render={<Link to="/patios/$id" params={{ id: patio.id }} />}
                            onClick={(event) => {
                                event.stopPropagation();
                            }}
                            onKeyDown={(event) => {
                                event.stopPropagation();
                            }}
                        >
                            <ArrowTopRight24Icon aria-hidden />
                            <span className="sr-only">Open {patio.name}</span>
                        </Button>
                    </div>
                    <Typography className={s.author} variant="text-sm" render={<p />}>
                        by Neos
                    </Typography>
                    <Typography className={s.id} variant="text-sm" render={<p />}>
                        ID {patio.id}
                    </Typography>
                </header>
                <footer className={s.footer}>
                    <Typography variant="text-sm" className={clsx(s.country, 'truncate')} render={<p />}>
                        <MapPinIcon aria-hidden />
                        <span className="sr-only">Country</span>
                        {patio.country}
                    </Typography>
                </footer>
            </div>
        </article>
    );
};
