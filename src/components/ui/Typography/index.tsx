import type { TypographyProps } from './types';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import clsx from 'clsx';
import s from './styles.module.css';

export const Typography: React.FC<TypographyProps> = ({ className, variant = 'body-m', render, ...rest }) => {
    const element = useRender({
        defaultTagName: 'p',
        props: mergeProps<'p'>({ className: clsx(s.wrap, className) }, rest),
        render,
        state: {
            variant,
        },
        stateAttributesMapping: {
            variant(value) {
                return { 'data-typography-variant': value };
            },
        },
    });

    return element;
};
