import type { MouseEvent } from 'react';
import type { InputProps } from './types';
import { useRef } from 'react';
import { Input as BaseInput } from '@base-ui/react/input';
import clsx from 'clsx';
import s from './styles.module.css';

export const Input: React.FC<InputProps> = ({ className, leftAddon, rightAddon, isRounded = false, ...rest }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        if (target === event.currentTarget || !target.closest('button, a, input, [role="button"]')) {
            event.preventDefault();
            inputRef.current?.focus();
        }
    };

    return (
        <div
            className={clsx(s.wrap, 'focus-within-primary', className)}
            data-rounded={isRounded}
            onMouseDown={handleMouseDown}
        >
            {leftAddon ? <span className={s.addon}>{leftAddon}</span> : null}
            <BaseInput className={s.input} ref={inputRef} {...rest} />
            {rightAddon ? <span className={s.addon}>{rightAddon}</span> : null}
        </div>
    );
};
