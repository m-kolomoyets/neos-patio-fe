import type { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';
import type { Ref } from 'react';

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
    /**
     * Ref to the inner viewport element — the element that actually scrolls.
     * Forward this when integrating with a virtualizer (e.g. `@tanstack/react-virtual`)
     * that needs to observe the scroll container directly.
     */
    viewportRef?: Ref<HTMLDivElement>;
};
