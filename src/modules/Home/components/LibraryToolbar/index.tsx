import type { WithClassName } from '@/lib/types';
import PlusIcon from '@/icons/plus_24.svg?react';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { PatioFilters } from '../PatioFilters';
import { PatioSort } from '../PatioSort';
import s from './styles.module.css';

export const LibraryToolbar: React.FC<WithClassName> = ({ className }) => {
    return (
        <div className={clsx(s.wrap, className)}>
            <Button variant="surface" size="md" render={<Link to="/create-patio" />}>
                <PlusIcon />
                Create patio
            </Button>
            <PatioFilters />
            <PatioSort />
        </div>
    );
};
