import type { Patio } from '@/services/patios/types';
import ArrowTopRight24Icon from '@/icons/arrow-top-right_24.svg?react';
import { Link } from '@tanstack/react-router';
import { AspectRatio } from '@/components/ui/AspectRatio';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

type Props = {
    patio: Patio;
};

export const FeaturedPatioCard: React.FC<Props> = ({ patio }) => {
    return (
        <article className={s.wrap} data-card-id={patio.id}>
            <AspectRatio ratio={381 / 408} className={s.media}>
                <img className={s.image} src={patio.previewHighUrl} alt={patio.name} loading="lazy" />
            </AspectRatio>
            <footer className={s.content}>
                <div className={s.titles}>
                    <Typography variant="text-md" render={<h3 />}>
                        {patio.name}
                    </Typography>
                    <Typography className={s.subtitle} variant="text-sm" render={<p />}>
                        by {patio.author}
                    </Typography>
                </div>
                <Button
                    variant="surface"
                    size="md"
                    title={`Open ${patio.name}`}
                    className={s['open-button']}
                    nativeButton={false}
                    render={<Link to="/patios/$id" params={{ id: patio.id }} />}
                >
                    Open
                    <span className="sr-only">{patio.name}</span>
                    <ArrowTopRight24Icon aria-hidden />
                </Button>
            </footer>
        </article>
    );
};
