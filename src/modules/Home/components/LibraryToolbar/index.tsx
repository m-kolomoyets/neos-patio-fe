import type { WithClassName } from '@/lib/types';
import PlusIcon from '@/icons/plus_24.svg?react';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Button } from '@/components/ui/Button';
import { PatioFilters } from '../PatioFilters';
import { PatioSort } from '../PatioSort';
import s from './styles.module.css';

export const LibraryToolbar: React.FC<WithClassName> = ({ className }) => {
    const isMobile = useIsMobile();

    return (
        <div className={clsx(s.wrap, className)}>
            {FEATURE_FLAGS.createPatio && (
                <Button
                    className={clsx(s.cta, s.create)}
                    variant="brand"
                    nativeButton={false}
                    size="md"
                    render={<Link to="/create-patio" />}
                >
                    <PlusIcon />
                    <span
                        className={clsx({
                            'sr-only': isMobile,
                        })}
                    >
                        Create New Patio
                    </span>
                </Button>
            )}
            <PatioFilters />
            <PatioSort />
        </div>
    );
};
