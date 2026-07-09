import { useCallback, useEffect, useRef } from 'react';

export function useSpotlight<T extends HTMLElement>(): React.RefCallback<T> {
    const elRef = useRef<T | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    const attach = useCallback((el: T) => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
        if (window.matchMedia('(pointer: coarse)').matches) return null;

        let rect: DOMRect | null = null;
        let rafId = 0;
        let pendingX = 0;
        let pendingY = 0;

        const writeVars = () => {
            rafId = 0;
            el.style.setProperty('--spot-x', `${pendingX}px`);
            el.style.setProperty('--spot-y', `${pendingY}px`);
        };

        const onMove = (event: PointerEvent) => {
            if (!rect) return;
            pendingX = event.clientX - rect.left;
            pendingY = event.clientY - rect.top;
            if (rafId === 0) rafId = requestAnimationFrame(writeVars);
        };

        const onEnter = (event: PointerEvent) => {
            if (event.pointerType !== 'mouse') return;
            rect = el.getBoundingClientRect();
            pendingX = event.clientX - rect.left;
            pendingY = event.clientY - rect.top;
            el.style.setProperty('--spot-x', `${pendingX}px`);
            el.style.setProperty('--spot-y', `${pendingY}px`);
            el.setAttribute('data-spot-active', 'true');
            el.addEventListener('pointermove', onMove, { passive: true });
        };

        const onLeave = () => {
            el.removeEventListener('pointermove', onMove);
            if (rafId !== 0) {
                cancelAnimationFrame(rafId);
                rafId = 0;
            }
            el.removeAttribute('data-spot-active');
            rect = null;
        };

        el.addEventListener('pointerenter', onEnter);
        el.addEventListener('pointerleave', onLeave);
        el.addEventListener('pointercancel', onLeave);

        return () => {
            el.removeEventListener('pointerenter', onEnter);
            el.removeEventListener('pointerleave', onLeave);
            el.removeEventListener('pointercancel', onLeave);
            el.removeEventListener('pointermove', onMove);
            if (rafId !== 0) cancelAnimationFrame(rafId);
            el.removeAttribute('data-spot-active');
            el.style.removeProperty('--spot-x');
            el.style.removeProperty('--spot-y');
        };
    }, []);

    const refCallback = useCallback<React.RefCallback<T>>(
        (el) => {
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
            elRef.current = el;
            if (el) {
                cleanupRef.current = attach(el);
            }
        },
        [attach]
    );

    useEffect(() => {
        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
        };
    }, []);

    return refCallback;
}
