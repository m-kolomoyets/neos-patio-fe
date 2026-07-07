import type { PatioAutocompleteOptionItemProps } from './types';
import ArrowTopRight24Icon from '@/icons/arrow-top-right_24.svg?react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import clsx from 'clsx';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

export const PatioAutocompleteOptionItem: React.FC<PatioAutocompleteOptionItemProps> = ({
    className,
    name,
    country,
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
                title: `Open ${name} patio`,
                children: (
                    <>
                        <div className={s.left}>
                            <Typography variant="text-sm" render={<span />} className={clsx(s.label, 'truncate')}>
                                {name}
                            </Typography>
                            <Typography variant="text-xs" render={<span />} className={clsx(s.description, 'truncate')}>
                                {country}
                            </Typography>
                        </div>
                        <span className={clsx(s.addon, s.right)}>
                            <ArrowTopRight24Icon className={s.checkmark} aria-hidden />
                        </span>
                    </>
                ),
            }
        ),
        render,
    });

    return element;
};
