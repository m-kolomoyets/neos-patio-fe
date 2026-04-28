import type { SeparatorProps } from './types';
import React from 'react';
import { Separator as BaseSeparator } from '@base-ui/react/separator';
import clsx from 'clsx';
import s from './styles.module.css';

export const Separator: React.FC<SeparatorProps> = ({ className, ...rest }) => {
    return <BaseSeparator className={clsx(s.wrap, 'surface-thin', className)} {...rest} />;
};
