import ArrowLeftIcon from '@/icons/arrow-left_24.svg?react';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { useCreatePatioMode } from '../../context/CreatePatioContext';
import { useCreatePatioNavigate } from '../../hooks/useCreatePatioRouteApi';
import { CreatePatioButton } from './components/CreatePatioButton';
import { GeocoderSearch } from './components/GeocoderSearch';
import s from './styles.module.css';

/**
 * Static header of the Create Patio surface. Three-zone grid so the title stays
 * truly centered regardless of side content widths. The right slot holds the
 * create-mode entry point and the geocoder search; in create mode the entry
 * button is gone — the only exits are the popup X and `Escape`.
 */
export const Header: React.FC = () => {
    const navigate = useCreatePatioNavigate();
    const { mode } = useCreatePatioMode();

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
                {mode === 'view' && <CreatePatioButton />}
                <GeocoderSearch />
            </div>
        </header>
    );
};
