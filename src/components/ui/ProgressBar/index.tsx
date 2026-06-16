import type { ProgressBarProps } from './types';
import { Progress as BaseProgress } from '@base-ui/react/progress';
import clsx from 'clsx';
import s from './styles.module.css';

/**
 * Determinate linear progress bar. `value` is 0–100 by default (override via `max`/`min`).
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    min = 0,
    max = 100,
    className,
    trackClassName,
    indicatorClassName,
    ...rest
}) => {
    return (
        <BaseProgress.Root value={value} min={min} max={max} className={clsx(s.root, className)} {...rest}>
            <BaseProgress.Track className={clsx(s.track, trackClassName)}>
                <BaseProgress.Indicator className={clsx(s.indicator, indicatorClassName)} />
            </BaseProgress.Track>
        </BaseProgress.Root>
    );
};
