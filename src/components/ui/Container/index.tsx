import type { ContainerProps } from './types';
import React from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import clsx from 'clsx';
import s from './styles.module.css';

export const Container: React.FC<ContainerProps> = ({ className, render, ...rest }) => {
    const element = useRender({
        defaultTagName: 'div',
        props: mergeProps<'div'>({ className: clsx(s.wrap, className) }, rest),
        render,
    });

    return element;
};
