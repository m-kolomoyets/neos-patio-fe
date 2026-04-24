import type { ScrollAreaProps } from './types';
import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';
import clsx from 'clsx';
import s from './styles.module.css';

export const ScrollArea: React.FC<ScrollAreaProps> = ({
    className,
    viewportClassName,
    orientation = 'vertical',
    children,
    ...rest
}) => {
    const showVertical = orientation === 'vertical' || orientation === 'both';
    const showHorizontal = orientation === 'horizontal' || orientation === 'both';

    return (
        <BaseScrollArea.Root className={clsx(s.root, className)} {...rest}>
            <BaseScrollArea.Viewport className={clsx(s.viewport, viewportClassName)}>
                <BaseScrollArea.Content className={s.content}>{children}</BaseScrollArea.Content>
            </BaseScrollArea.Viewport>
            {showVertical ? (
                <BaseScrollArea.Scrollbar className={s.scrollbar} orientation="vertical">
                    <BaseScrollArea.Thumb className={s.thumb} />
                </BaseScrollArea.Scrollbar>
            ) : null}
            {showHorizontal ? (
                <BaseScrollArea.Scrollbar className={s.scrollbar} orientation="horizontal">
                    <BaseScrollArea.Thumb className={s.thumb} />
                </BaseScrollArea.Scrollbar>
            ) : null}
            {orientation === 'both' ? <BaseScrollArea.Corner className={s.corner} /> : null}
        </BaseScrollArea.Root>
    );
};
