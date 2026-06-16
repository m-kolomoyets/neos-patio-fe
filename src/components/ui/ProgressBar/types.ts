import type { ProgressIndicatorProps, ProgressRootProps, ProgressTrackProps } from '@base-ui/react/progress';

export type { ProgressIndicatorProps, ProgressRootProps, ProgressTrackProps };

export type ProgressBarProps = Pick<ProgressRootProps, 'value' | 'min' | 'max' | 'aria-label' | 'aria-labelledby'> & {
    /**
     * Class applied to the progress root.
     */
    className?: string;
    /**
     * Class applied to the track (the unfilled rail).
     */
    trackClassName?: string;
    /**
     * Class applied to the indicator (the filled portion).
     */
    indicatorClassName?: string;
};
