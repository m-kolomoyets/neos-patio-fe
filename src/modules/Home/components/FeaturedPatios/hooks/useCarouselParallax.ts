import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

type SnapCallback = (_s: number) => void;

type Params = {
    viewportRef: React.RefObject<HTMLDivElement | null>;
    dataKey: unknown;
};

type CardPair = {
    id: string;
    card: HTMLElement;
    left: number;
    width: number;
    lastS: number;
};

export type CarouselParallaxApi = {
    registerSnap: (_id: string, _cb: SnapCallback) => () => void;
};

const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const clamp = (v: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, v));
};

export const useCarouselParallax = ({ viewportRef, dataKey }: Params): CarouselParallaxApi => {
    const pairsRef = useRef<CardPair[]>([]);
    const callbacksRef = useRef<Map<string, SnapCallback>>(new Map());
    const lastSnapRef = useRef<Map<string, number>>(new Map());
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
        if (viewportWidth === 0) return;
        const viewportCenter = viewport.scrollLeft + viewportWidth / 2;
        const halfViewport = viewportWidth / 2;
        const pairs = pairsRef.current;
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            if (pair.width === 0) continue;
            const cardCenter = pair.left + pair.width / 2;
            const delta = cardCenter - viewportCenter;
            const n = clamp(delta / halfViewport, -1, 1);
            const s = Math.round(((n + 1) / 2) * 10000) / 10000;
            if (s === pair.lastS) continue;
            pair.lastS = s;
            lastSnapRef.current.set(pair.id, s);
            const cb = callbacksRef.current.get(pair.id);
            if (cb) cb(s);
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
            const id = card.dataset.cardId;
            if (!id) continue;
            pairs.push({
                id,
                card,
                left: card.offsetLeft,
                width: card.offsetWidth,
                lastS: Number.NaN,
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

    const registerSnap = useCallback((id: string, cb: SnapCallback): (() => void) => {
        callbacksRef.current.set(id, cb);
        const last = lastSnapRef.current.get(id);
        if (last !== undefined) cb(last);
        return () => {
            const current = callbacksRef.current.get(id);
            if (current === cb) callbacksRef.current.delete(id);
        };
    }, []);

    return { registerSnap };
};
