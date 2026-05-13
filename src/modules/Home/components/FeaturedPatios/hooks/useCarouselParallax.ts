import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

const MAX_X_PX = 48;

type Params = {
    viewportRef: React.RefObject<HTMLDivElement | null>;
    dataKey: unknown;
};

type CardPair = {
    card: HTMLElement;
    stack: HTMLElement;
    left: number;
    width: number;
    lastTx: number;
};

const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const clamp = (v: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, v));
};

export const useCarouselParallax = ({ viewportRef, dataKey }: Params): void => {
    const pairsRef = useRef<CardPair[]>([]);
    const rafIdRef = useRef<number | null>(null);
    const reducedRef = useRef<boolean>(false);

    useLayoutEffect(() => {
        reducedRef.current = prefersReducedMotion();
    }, []);

    const measure = useCallback(() => {
        const pairs = pairsRef.current;
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            pair.left = pair.card.offsetLeft;
            pair.width = pair.card.offsetWidth;
        }
    }, []);

    const update = useCallback(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        const viewportWidth = viewport.clientWidth;
        const viewportCenter = viewport.scrollLeft + viewportWidth / 2;
        const halfViewport = viewportWidth / 2;
        const pairs = pairsRef.current;
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            if (pair.width === 0) continue;
            const cardCenter = pair.left + pair.width / 2;
            const delta = cardCenter - viewportCenter;
            const n = clamp(delta / halfViewport, -1, 1);
            const tx = Math.round(-n * MAX_X_PX * 100) / 100;
            if (tx === pair.lastTx) continue;
            pair.lastTx = tx;
            pair.stack.style.setProperty('--tx', String(tx));
        }
    }, [viewportRef]);

    const scheduleUpdate = useCallback(() => {
        if (rafIdRef.current !== null) return;
        rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;
            update();
        });
    }, [update]);

    useLayoutEffect(() => {
        if (reducedRef.current) return;
        const viewport = viewportRef.current;
        if (!viewport) return;
        const cards = Array.from(viewport.querySelectorAll<HTMLElement>('[data-card-id]'));
        const pairs: CardPair[] = [];
        for (const card of cards) {
            const stack = card.querySelector<HTMLElement>('[data-stack]');
            if (!stack) continue;
            pairs.push({
                card,
                stack,
                left: card.offsetLeft,
                width: card.offsetWidth,
                lastTx: Number.NaN,
            });
        }
        pairsRef.current = pairs;
        update();
    }, [dataKey, update, viewportRef]);

    useEffect(() => {
        if (reducedRef.current) return;
        const viewport = viewportRef.current;
        if (!viewport) return;
        const onResize = () => {
            measure();
            scheduleUpdate();
        };
        viewport.addEventListener('scroll', scheduleUpdate, { passive: true });
        window.addEventListener('resize', onResize);
        return () => {
            viewport.removeEventListener('scroll', scheduleUpdate);
            window.removeEventListener('resize', onResize);
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        };
    }, [measure, scheduleUpdate, viewportRef]);
};
