import type { WithClassName } from '@/lib/types';
import PlusIcon from '@/icons/plus_24.svg?react';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { Button } from '@/components/ui/Button';
import { PatioFilters } from '../PatioFilters';
import { PatioSort } from '../PatioSort';
import s from './styles.module.css';

export const LibraryToolbar: React.FC<WithClassName> = ({ className }) => {
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
                    Create New Patio
                </Button>
            )}
            <PatioFilters />
            <PatioSort />
        </div>
    );
};
