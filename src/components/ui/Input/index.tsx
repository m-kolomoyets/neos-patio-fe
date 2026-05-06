import type { InputProps } from './types';
import React from 'react';
import { Input as BaseInput } from '@base-ui/react/input';
import clsx from 'clsx';
import { motion } from 'motion/react';
import s from './styles.module.css';

export const Input: React.FC<InputProps & { ref?: React.Ref<HTMLInputElement> }> = ({
    className,
    leftAddon,
    rightAddon,
    isRounded = false,
    size = 'default',
    ref,
    wrapperRef,
    ...rest
}) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => {
        return inputRef.current as HTMLInputElement;
    });

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        if (target === event.currentTarget || !target.closest('button, a, input, [role="button"]')) {
            event.preventDefault();
            inputRef.current?.focus();
        }
    };

    return (
        <motion.div
            ref={wrapperRef}
            layoutId="wrapper"
            className={clsx(s.wrap, 'focus-within-primary', className)}
            data-rounded={isRounded}
            data-size={size}
            onMouseDown={handleMouseDown}
        >
            {leftAddon ? <span className={s.addon}>{leftAddon}</span> : null}
            <BaseInput className={s.input} ref={inputRef} {...rest} />
            {rightAddon ? <span className={s.addon}>{rightAddon}</span> : null}
        </motion.div>
    );
};
