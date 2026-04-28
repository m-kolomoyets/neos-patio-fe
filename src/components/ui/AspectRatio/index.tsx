import type { AspectRatioProps } from './types';
import React from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import clsx from 'clsx';
import s from './styles.module.css';

export const AspectRatio: React.FC<AspectRatioProps> = ({ ratio = 1, className, render, style, ...rest }) => {
    const element = useRender({
        defaultTagName: 'div',
        props: mergeProps<'div'>({ className: clsx(s.inner, className), style }, rest),
        render,
    });

    return (
        <div className={s.wrap} style={{ paddingBottom: `${100 / ratio}%` }}>
            {element}
        </div>
    );
};
