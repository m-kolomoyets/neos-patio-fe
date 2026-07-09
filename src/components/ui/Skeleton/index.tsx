import type { WithClassName } from '@/lib/types';
import clsx from 'clsx';
import s from './styles.module.css';

export const Skeleton: React.FC<WithClassName> = ({ className, ...rest }) => {
    return <span className={clsx(s.wrap, className)} {...rest} aria-hidden />;
};
