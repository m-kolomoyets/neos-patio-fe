import type { Patio } from '@/services/patios/types';
import { Link } from '@tanstack/react-router';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

type Props = {
    patio: Patio;
};

export const PatioLibraryCard: React.FC<Props> = ({ patio }) => {
    return (
        <Link to="/patios/$id" params={{ id: patio.id }} className={s.wrap}>
            <div className={s.media}>
                <img className={s.image} src={patio.thumbnailUrl} alt={patio.name} loading="lazy" />
                <span className={s['id-badge']}>ID {patio.id}</span>
            </div>
            <div className={s.body}>
                <Typography variant="text-md" className={s.name}>
                    {patio.name}
                </Typography>
                <Typography variant="text-sm" className={s.country}>
                    {patio.country}
                </Typography>
            </div>
        </Link>
    );
};
