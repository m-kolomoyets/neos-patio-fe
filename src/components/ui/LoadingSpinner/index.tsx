import SpinnerGradient32Icon from '@/icons/spinner-gradient_32.svg?react';
import clsx from 'clsx';
import { WithClassName } from '@/lib/types';
import s from './styles.module.css';

export const LoadingSpinner: React.FC<WithClassName> = ({ className }) => {
    return <SpinnerGradient32Icon className={clsx(s.wrap, className)} aria-hidden />;
};
