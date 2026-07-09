import type { UseResizeObserverCallback } from '@react-hookz/web';
import React from 'react';
import { useHookableRef, useRafCallback, useResizeObserver } from '@react-hookz/web';

export type Measures = {
    width: number;
    height: number;
};

export type Measurer = (_entry: ResizeObserverEntry) => Measures;

/**
 * Measures ResizeObserverEntry by `content-box` sizing model
 * Default measurer for `useMeasure`
 */
export const contentBoxMeasurer: Measurer = (entry) => {
    return {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
    };
};

/**
 *  Measures ResizeObserverEntry by `border-box` sizing model
 */
export const borderBoxMeasurer: Measurer = (entry) => {
    return {
        height: entry.borderBoxSize[0].blockSize,
        width: entry.borderBoxSize[0].inlineSize,
    };
};

/**
 * Uses ResizeObserver to track element dimensions and re-render component when they change.
 *
 * @param enabled Whether resize observer is enabled or not.
 * @param observerEntryMatcher A custom measurer function to get measurements based on some box sizing model.
 * `Content-box` sizing is default
 */
export function useMeasure<T extends Element>(
    enabled = true,
    measurer = contentBoxMeasurer
): [Measures | undefined, React.MutableRefObject<T | null>] {
    const [element, setElement] = React.useState<T | null>(null);
    const elementRef = useHookableRef<T | null>(null, (v) => {
        setElement(v);

        return v;
    });

    const [measures, setMeasures] = React.useState<Measures>();
    const [observerHandler] = useRafCallback<UseResizeObserverCallback>((entry) => {
        setMeasures(measurer(entry));
    });

    useResizeObserver(element, observerHandler, enabled);

    return [measures, elementRef] as const;
}
