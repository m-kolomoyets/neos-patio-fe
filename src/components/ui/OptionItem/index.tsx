import type { OptionItemProps } from './types';
import CheckmarkIcon from '@/icons/checkmark-circle-filled_24.svg?react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import clsx from 'clsx';
import { Typography } from '../Typography';
import s from './styles.module.css';

export const OptionItem: React.FC<OptionItemProps> = ({
    className,
    variant = 'default',
    leftAddon,
    checked = false,
    isWithChecked = true,
    children,
    render,
    ...rest
}) => {
    const element = useRender({
        defaultTagName: 'div',
        props: mergeProps<'div'>(
            {
                className: clsx(s.wrap, className),
            },
            rest,
            {
                children: (
                    <>
                        <Typography variant="text-sm" render={<span />} className={clsx(s.label, 'truncate')}>
                            {leftAddon ? <span className={clsx(s.addon, s.left)}>{leftAddon}</span> : null}
                            {children}
                        </Typography>
                        {isWithChecked ? (
                            <span className={clsx(s.addon, s.right)}>
                                <CheckmarkIcon className={s.checkmark} aria-hidden />
                            </span>
                        ) : null}
                    </>
                ),
            }
        ),
        render,
        state: { checked, variant },
        stateAttributesMapping: {
            checked(value) {
                return { 'data-checked': value ? 'true' : 'false' };
            },
            variant(value) {
                return { 'data-option-item-variant': value };
            },
        },
    });

    return element;
};
