import type { ScrollAreaProps } from './types';
import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';
import clsx from 'clsx';
import s from './styles.module.css';

export const ScrollArea: React.FC<ScrollAreaProps> = ({
    className,
    viewportClassName,
    viewportRef,
    orientation = 'vertical',
    children,
    ...rest
}) => {
    const showVertical = orientation === 'vertical' || orientation === 'both';
    const showHorizontal = orientation === 'horizontal' || orientation === 'both';

    return (
        <BaseScrollArea.Root className={clsx(s.root, className)} {...rest}>
            <BaseScrollArea.Viewport ref={viewportRef} className={clsx(s.viewport, viewportClassName)}>
                <BaseScrollArea.Content className={clsx(s.content, 'scroll-area-content')}>
                    {children}
                </BaseScrollArea.Content>
            </BaseScrollArea.Viewport>
            {showVertical ? (
                <BaseScrollArea.Scrollbar
                    className={clsx(s.scrollbar, 'scroll-area-scrollbar', 'scroll-area-scrollbar-vertical')}
                    orientation="vertical"
                >
                    <BaseScrollArea.Thumb className={clsx(s.thumb, 'scroll-area-thumb')} />
                </BaseScrollArea.Scrollbar>
            ) : null}
            {showHorizontal ? (
                <BaseScrollArea.Scrollbar
                    className={clsx(s.scrollbar, 'scroll-area-scrollbar', 'scroll-area-scrollbar-horizontal')}
                    orientation="horizontal"
                >
                    <BaseScrollArea.Thumb className={clsx(s.thumb, 'scroll-area-thumb')} />
                </BaseScrollArea.Scrollbar>
            ) : null}
            {orientation === 'both' ? <BaseScrollArea.Corner className={s.corner} /> : null}
        </BaseScrollArea.Root>
    );
};
