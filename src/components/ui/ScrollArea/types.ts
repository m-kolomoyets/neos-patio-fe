import type { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';

export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

export type ScrollAreaProps = BaseScrollArea.Root.Props & {
    /**
     * Which scrollbars to render.
     * @default 'vertical'
     */
    orientation?: ScrollAreaOrientation;
    /**
     * Class applied to the inner viewport (the actually scrollable element).
     */
    viewportClassName?: string;
};
