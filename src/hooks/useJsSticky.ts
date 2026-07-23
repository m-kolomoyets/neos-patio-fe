import React from 'react';

type Options = {
    /**
     * Scroll container the header pins to. CSS selector resolved on mount,
     * or omit for the document viewport.
     */
    rootSelector?: string | null;
};

/**
 * Two-mode sticky for a header whose `backdrop-filter` must escape an ancestor
 * `clip-path` (squircle) / `isolation` chain — each of those is a backdrop root
 * that would blank the blur, so the pinned header is PORTALED to `<body>`.
 *
 * - NOT stuck → the header stays in normal document flow (`position: static`) and
 *   scrolls natively with the content. No JS positioning, so no per-frame glitch.
 * - Stuck → a fixed wrapper is portaled to `<body>` at the pin line; the header
 *   inside it slides in from the top (the wrapper clips via `overflow: hidden`).
 *   A spacer reserves the vacated height so flow doesn't jump.
 *
 * `stuck` flips only once the header is FULLY out of view — the in-flow `sentinelRef`
 * marker sits at the header's bottom edge and crossing the container top toggles it.
 * `containerRef` supplies the wrapper's left/width; `wrapperRef` is positioned
 * imperatively; `headerRef` is measured for the wrapper/spacer height + ride-up.
 */
export const useJsSticky = ({ rootSelector = null }: Options = {}) => {
    const containerRef = React.useRef<HTMLElement | null>(null);
    const sentinelRef = React.useRef<HTMLDivElement | null>(null);
    const wrapperRef = React.useRef<HTMLDivElement | null>(null);
    const headerNodeRef = React.useRef<HTMLElement | null>(null);
    const headerObserverRef = React.useRef<ResizeObserver | null>(null);
    const [stuck, setStuck] = React.useState(false);
    const [headerHeight, setHeaderHeight] = React.useState(0);
    const stuckRef = React.useRef(false);

    // Callback ref: measures the header in BOTH modes (in-flow + portaled) so the
    // spacer already knows the correct height the instant the header leaves flow —
    // no one-frame content jump at the swap.
    const headerRef = React.useCallback(function headerRef(node: HTMLElement | null) {
        headerNodeRef.current = node;
        headerObserverRef.current?.disconnect();
        if (node) {
            setHeaderHeight(node.offsetHeight);
            const observer = new ResizeObserver(() => {
                setHeaderHeight(node.offsetHeight);
            });
            observer.observe(node);
            headerObserverRef.current = observer;
        }
    }, []);

    const getRoot = React.useCallback(
        function getRoot() {
            return rootSelector ? document.querySelector(rootSelector) : null;
        },
        [rootSelector]
    );

    // Detect full-exit from the in-flow sentinel (header bottom) crossing the top.
    React.useEffect(
        function detectStuck() {
            const sentinel = sentinelRef.current;
            if (!sentinel) {
                return;
            }

            const root = getRoot();
            const scroller: Element | Window = root ?? window;
            let frame = 0;

            const measure = () => {
                frame = 0;
                const pinTop = root ? root.getBoundingClientRect().top : 0;
                const isStuck = sentinel.getBoundingClientRect().top <= pinTop + 0.5;
                if (isStuck !== stuckRef.current) {
                    stuckRef.current = isStuck;
                    setStuck(isStuck);
                }
            };

            const schedule = () => {
                if (!frame) {
                    frame = requestAnimationFrame(measure);
                }
            };

            measure();
            scroller.addEventListener('scroll', schedule, { passive: true });
            window.addEventListener('resize', schedule);

            return () => {
                scroller.removeEventListener('scroll', schedule);
                window.removeEventListener('resize', schedule);
                if (frame) {
                    cancelAnimationFrame(frame);
                }
            };
        },
        [getRoot]
    );

    // While stuck, glue the fixed wrapper to the container box and let it ride up
    // once the section's bottom reaches the pin line.
    React.useEffect(
        function positionWhileStuck() {
            const wrapper = wrapperRef.current;
            const header = headerNodeRef.current;
            const container = containerRef.current;
            if (!stuck || !wrapper || !header || !container) {
                return;
            }

            const root = getRoot();
            const scroller: Element | Window = root ?? window;
            let frame = 0;

            const measure = () => {
                frame = 0;
                const box = container.getBoundingClientRect();
                const pinTop = root ? root.getBoundingClientRect().top : 0;
                const top = Math.min(pinTop, box.bottom - header.offsetHeight);
                wrapper.style.left = `${box.left}px`;
                wrapper.style.width = `${box.width}px`;
                wrapper.style.top = `${top}px`;
            };

            const schedule = () => {
                if (!frame) {
                    frame = requestAnimationFrame(measure);
                }
            };

            measure();
            scroller.addEventListener('scroll', schedule, { passive: true });
            window.addEventListener('resize', schedule);

            return () => {
                scroller.removeEventListener('scroll', schedule);
                window.removeEventListener('resize', schedule);
                if (frame) {
                    cancelAnimationFrame(frame);
                }
            };
        },
        [stuck, getRoot]
    );

    return { containerRef, sentinelRef, wrapperRef, headerRef, stuck, headerHeight } as const;
};
