import { useCallback, useEffect, useRef } from 'react';
import { HOME_SCROLL_ROOT_SELECTOR } from '../../../constants';

const PARALLAX_RANGE_PCT = 25;
const IO_ROOT_MARGIN = '20% 0px';

type Entry = {
    cardEl: HTMLElement;
    imgEl: HTMLElement;
};

type Bus = {
    refCount: number;
    root: HTMLElement | null;
    rootRect: DOMRect | null;
    active: Set<Entry>;
    registry: Map<HTMLElement, Entry>;
    io: IntersectionObserver | null;
    ro: ResizeObserver | null;
    rafId: number | null;
    onScroll: (() => void) | null;
};

let bus: Bus | null = null;

const prefersReducedMotion = (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const tick = () => {
    if (!bus) {
        return;
    }
    bus.rafId = null;
    const root = bus.root;
    if (!root || bus.active.size === 0) {
        return;
    }
    bus.rootRect = root.getBoundingClientRect();
    const rootRect = bus.rootRect;
    const rootCenter = rootRect.top + rootRect.height / 2;
    const halfRoot = rootRect.height / 2;

    bus.active.forEach((entry) => {
        const rect = entry.cardEl.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const denom = halfRoot + rect.height / 2;
        let progress = (cardCenter - rootCenter) / denom;
        if (progress > 1) progress = 1;
        else if (progress < -1) progress = -1;
        const translate = progress * -PARALLAX_RANGE_PCT;
        entry.imgEl.style.transform = `translate3d(0, ${translate.toFixed(3)}%, 0)`;
    });
};

const scheduleTick = () => {
    if (!bus || bus.rafId !== null) {
        return;
    }
    bus.rafId = requestAnimationFrame(tick);
};

const handleIo: IntersectionObserverCallback = (entries) => {
    if (!bus) {
        return;
    }
    entries.forEach((ioEntry) => {
        const entry = bus!.registry.get(ioEntry.target as HTMLElement);
        if (!entry) {
            return;
        }
        if (ioEntry.isIntersecting) {
            bus!.active.add(entry);
            entry.imgEl.dataset.parallaxActive = 'true';
        } else {
            bus!.active.delete(entry);
            delete entry.imgEl.dataset.parallaxActive;
            entry.imgEl.style.transform = '';
        }
    });
    scheduleTick();
};

const ensureBus = (): Bus | null => {
    if (bus) {
        return bus;
    }
    const root = document.querySelector<HTMLElement>(HOME_SCROLL_ROOT_SELECTOR);
    if (!root) {
        return null;
    }
    const onScroll = () => {
        return scheduleTick();
    };
    const io = new IntersectionObserver(handleIo, {
        root,
        rootMargin: IO_ROOT_MARGIN,
        threshold: 0,
    });
    const ro = new ResizeObserver(() => {
        if (bus) {
            bus.rootRect = null;
            scheduleTick();
        }
    });
    ro.observe(root);
    root.addEventListener('scroll', onScroll, { passive: true });
    bus = {
        refCount: 0,
        root,
        rootRect: null,
        active: new Set(),
        registry: new Map(),
        io,
        ro,
        rafId: null,
        onScroll,
    };
    return bus;
};

const teardownBusIfIdle = () => {
    if (!bus || bus.refCount > 0) {
        return;
    }
    if (bus.root && bus.onScroll) {
        bus.root.removeEventListener('scroll', bus.onScroll);
    }
    bus.io?.disconnect();
    bus.ro?.disconnect();
    if (bus.rafId !== null) {
        cancelAnimationFrame(bus.rafId);
    }
    bus = null;
};

const subscribe = (cardEl: HTMLElement, imgEl: HTMLElement) => {
    const b = ensureBus();
    if (!b) {
        return () => {
            return undefined;
        };
    }
    const entry: Entry = { cardEl, imgEl };
    b.registry.set(cardEl, entry);
    b.refCount += 1;
    b.io?.observe(cardEl);

    return () => {
        if (!bus) {
            return;
        }
        bus.io?.unobserve(cardEl);
        bus.active.delete(entry);
        bus.registry.delete(cardEl);
        bus.refCount -= 1;
        imgEl.style.transform = '';
        delete imgEl.dataset.parallaxActive;
        teardownBusIfIdle();
    };
};

export const useParallax = (enabled = true) => {
    const cardElRef = useRef<HTMLElement | null>(null);
    const imgElRef = useRef<HTMLElement | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    const wire = useCallback(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }
        const cardEl = cardElRef.current;
        const imgEl = imgElRef.current;
        if (!cardEl || !imgEl) {
            return;
        }
        if (!enabled) {
            imgEl.style.transform = '';
            return;
        }
        if (prefersReducedMotion()) {
            return;
        }
        unsubscribeRef.current = subscribe(cardEl, imgEl);
    }, [enabled]);

    const cardRef = useCallback(
        (el: HTMLElement | null) => {
            cardElRef.current = el;
            wire();
        },
        [wire]
    );

    const imgRef = useCallback(
        (el: HTMLElement | null) => {
            imgElRef.current = el;
            wire();
        },
        [wire]
    );

    useEffect(() => {
        return () => {
            unsubscribeRef.current?.();
            unsubscribeRef.current = null;
        };
    }, []);

    return { cardRef, imgRef };
};
