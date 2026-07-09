import clsx from 'clsx';
import { WithClassName } from '@/lib/types';
import s from './styles.module.css';

export const LoadingSpinner: React.FC<WithClassName> = ({ className }) => {
    return <div className={clsx(s.wrap, className)} aria-hidden />;
};
