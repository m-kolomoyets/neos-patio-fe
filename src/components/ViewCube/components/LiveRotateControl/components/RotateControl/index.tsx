import type { RotateControlProps } from './types';
import React from 'react';
import ArrowRightIcon from '@/icons/redo_24.svg?react';
import ArrowLeftIcon from '@/icons/undo_24.svg?react';
import clsx from 'clsx';
import s from './styles.module.css';

export const RotateControl: React.FC<RotateControlProps> = ({ className, onRotateLeft, onRotateRight }) => {
    return (
        <div className={clsx(s.wrap, className)}>
            <button
                type="button"
                className={clsx(s.cta, s.left, 'focus-primary')}
                aria-label="Rotate left"
                onClick={onRotateLeft}
            >
                <ArrowLeftIcon />
                <span className="sr-only">Rotate left</span>
            </button>
            <button
                type="button"
                className={clsx(s.cta, s.right, 'focus-primary')}
                aria-label="Rotate right"
                onClick={onRotateRight}
            >
                <ArrowRightIcon />
                <span className="sr-only">Rotate right</span>
            </button>
        </div>
    );
};
