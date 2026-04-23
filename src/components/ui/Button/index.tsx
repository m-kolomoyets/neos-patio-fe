import type { ButtonProps } from './types';
import Spinner20Icon from '@/icons/spinner_20.svg?react';
import { Button as BaseButton } from '@base-ui/react/button';
import clsx from 'clsx';
import s from './styles.module.css';

export const Button: React.FC<ButtonProps> = ({
    className,
    variant = 'brand',
    size = 'md',
    isIcon = false,
    children,
    disabled = false,
    isLoading = false,
    ...rest
}) => {
    return (
        <BaseButton
            className={clsx(s.wrap, 'focus-primary', className, {
                'surface-thin': variant === 'surface',
            })}
            {...rest}
            data-button-variant={variant}
            data-button-size={size}
            data-button-is-icon={isIcon}
            data-button-is-loading={isLoading}
            disabled={isLoading || disabled}
        >
            {isLoading ? <Spinner20Icon className={s.spinner} /> : null}
            {children}
        </BaseButton>
    );
};
