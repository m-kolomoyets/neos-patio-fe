import type { Patio } from '@/services/patios/types';
import ArrowOpenIcon from '@/icons/arrow-top-right-circle-filled_24.svg?react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

type Props = {
    patio: Patio;
};

export const FeaturedPatioCard: React.FC<Props> = ({ patio }) => {
    return (
        <article className={s.wrap} data-card-id={patio.id}>
            <div className={s.media}>
                <img className={s.image} src={patio.thumbnailUrl} alt={patio.name} loading="lazy" />
                <div className={s.gradient} />
            </div>
            <div className={s.content}>
                <div className={s['header-row']}>
                    <div className={s.titles}>
                        <Typography variant="display-sm">{patio.name}</Typography>
                        <Typography variant="text-md" className={s.subtitle}>
                            by {patio.author}
                        </Typography>
                    </div>
                    <Button
                        isIcon
                        variant="surface"
                        size="lg"
                        aria-label={`Open ${patio.name}`}
                        className={s['open-button']}
                        nativeButton={false}
                        render={<Link to="/patios/$id" params={{ id: patio.id }} />}
                    >
                        <ArrowOpenIcon />
                    </Button>
                </div>
            </div>
        </article>
    );
};
