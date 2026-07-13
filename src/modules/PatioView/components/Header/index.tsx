import ArrowLeftIcon from '@/icons/arrow-left_24.svg?react';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { usePatioViewNavigate } from '../../hooks/usePatioViewRouteApi';
import s from './styles.module.css';

type HeaderProps = {
    name: string;
};

/**
 * Read-only View header. Three-zone grid keeps the patio name truly centered.
 * Left = back-to-home. Right slot is intentionally empty: no location search,
 * no mode/create controls on the view surface.
 */
export const Header: React.FC<HeaderProps> = ({ name }) => {
    const navigate = usePatioViewNavigate();

    return (
        <header className={s.wrap}>
            <div className={s.left}>
                <Button
                    variant="surface"
                    size="lg"
                    isIcon
                    aria-label="Back to home"
                    onClick={() => {
                        navigate({ to: '/' });
                    }}
                >
                    <ArrowLeftIcon />
                </Button>
            </div>
            <div className={s['titles-wrap']}>
                <Typography className={s.title} variant="display-xs" render={<h1 />}>
                    {name}
                </Typography>
                {/* TODO: retrieve quote from the API */}
                <Typography className={s.description} variant="text-sm">
                    Every good tree bears good fruit
                </Typography>
            </div>
            <div />
        </header>
    );
};
