import React from 'react';

type Options = {
    enabled?: boolean;
    /**
     * Scroll container the sticky element pins to. Pass a CSS selector resolved on mount,
     * or `null` for the document viewport.
     */
    rootSelector?: string | null;
};

const isScrollStateSupported =
    typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('container-type', 'scroll-state');

/**
 * Tracks whether a `position: sticky` element is currently pinned to the top of its scroll container.
 * Auto-reads the element's computed `top` so it works for any sticky offset.
 * No-op when the browser supports `container-type: scroll-state` — use the native CSS feature instead.
 */
export const useStickyStuck = ({ enabled = true, rootSelector = null }: Options = {}) => {
    const [node, setNode] = React.useState<Element | null>(null);
    const [stuck, setStuck] = React.useState(false);
    const skip = !enabled || isScrollStateSupported;

    const ref = React.useCallback((next: Element | null) => {
        return setNode(next);
    }, []);

    React.useEffect(() => {
        if (skip || !node) return;

        const root = rootSelector ? document.querySelector(rootSelector) : null;
        const scroller: Element | Window = root ?? window;
        let frame = 0;

        const measure = () => {
            frame = 0;
            const nodeRect = node.getBoundingClientRect();
            const rootTop = root ? root.getBoundingClientRect().top : 0;
            const stickyTop = parseFloat(getComputedStyle(node).top) || 0;
            setStuck(nodeRect.top - rootTop <= stickyTop + 0.5);
        };

        const schedule = () => {
            if (frame) return;
            frame = requestAnimationFrame(measure);
        };

        measure();
        scroller.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);

        return () => {
            scroller.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [skip, rootSelector, node]);

    return { ref, flag: skip ? false : stuck, isNativeSupported: isScrollStateSupported } as const;
};
