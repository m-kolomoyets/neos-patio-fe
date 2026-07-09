import type { PopupWrapperProps } from './types';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import clsx from 'clsx';
import s from './styles.module.css';

export const PopupWrapper: React.FC<PopupWrapperProps> = ({ className, render, ...rest }) => {
    return useRender({
        defaultTagName: 'div',
        props: mergeProps<'div'>({ className: clsx(s.wrap, className) }, rest),
        render,
    });
};
