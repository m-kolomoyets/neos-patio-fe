import ArrowLeftIcon from '@/icons/arrow-left_24.svg?react';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { useCreatePatioNavigate } from '../../hooks/useCreatePatioRouteApi';
import { GeocoderSearch } from './components/GeocoderSearch';
import { ModeZoomButton } from './components/ModeZoomButton';
import s from './styles.module.css';

/**
 * Static header of the Create Patio surface. Three-zone grid so the title stays
 * truly centered regardless of side content widths. The right slot is reserved
 * for the geocoder search + mode/zoom button landed in later slices.
 */
export const Header: React.FC = () => {
    const navigate = useCreatePatioNavigate();

    return (
        <header className={s.wrap}>
            <div className={s.left}>
                <Button
                    variant="surface"
                    size="md"
                    isIcon
                    aria-label="Back to home"
                    onClick={() => {
                        navigate({ to: '/' });
                    }}
                >
                    <ArrowLeftIcon />
                </Button>
            </div>
            <Typography className={s.title} variant="display-xs" render={<h1 />}>
                Create patio
            </Typography>
            <div className={s.right}>
                <GeocoderSearch />
                <ModeZoomButton />
            </div>
        </header>
    );
};
