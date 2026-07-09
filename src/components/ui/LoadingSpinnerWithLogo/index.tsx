import Logo from '@/icons/logo-sm_35.svg?react';
import clsx from 'clsx';
import { WithClassName } from '@/lib/types';
import s from './styles.module.css';

/**
 * Branded loading spinner: the {@link LoadingSpinner} conic ring with the Neos
 * logo held static in its center. The logo tints via `currentColor`, so set the
 * color (and size) through `className`.
 */
export const LoadingSpinnerWithLogo: React.FC<WithClassName> = ({ className }) => {
    return (
        <div className={clsx(s.wrap, className)} aria-hidden>
            <div className={s.ring} />
            <Logo className={s.logo} />
        </div>
    );
};
