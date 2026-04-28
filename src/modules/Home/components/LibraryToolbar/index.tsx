import type { WithClassName } from '@/lib/types';
import clsx from 'clsx';
import { PatioFilters } from '../PatioFilters';
import { PatioSort } from '../PatioSort';
import s from './styles.module.css';

export const LibraryToolbar: React.FC<WithClassName> = ({ className }) => {
    return (
        <div className={clsx(s.wrap, className)}>
            <PatioFilters />
            <PatioSort />
        </div>
    );
};
