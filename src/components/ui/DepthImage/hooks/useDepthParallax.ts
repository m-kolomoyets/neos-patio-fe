import type { Renderer } from '../utils/glRenderer';
import { useEffect, useRef, useState } from 'react';
import { getDepthAssets } from '../utils/cache';
import { createRenderer } from '../utils/glRenderer';

const LERP = 0.08;
const EPSILON = 0.0005;
const IO_MARGIN = '100px';

type Args = {
    src: string;
    strength: number;
    focus: number;
    invertDepth: boolean;
    enabled: boolean;
};

type State = 'idle' | 'ready' | 'failed';

export const useDepthParallax = ({ src, strength, focus, invertDepth, enabled }: Args) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<Renderer | null>(null);
    const targetRef = useRef({ x: 0, y: 0 });
    const currentRef = useRef({ x: 0, y: 0 });
    const rafRef = useRef<number | null>(null);
    const visibleRef = useRef(false);
    const hoveringRef = useRef(false);

    const [state, setState] = useState<State>('idle');

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        getDepthAssets(src)
            .then((assets) => {
                if (cancelled) return;
                const canvas = canvasRef.current;
                if (!canvas) return;
                const r = createRenderer(canvas, assets.color, assets.depth, {
                    strength,
                    focus,
                    invert: invertDepth,
                });
                if (!r) {
                    setState('failed');
                    return;
                }
                rendererRef.current = r;
                setState('ready');
            })
            .catch(() => {
                if (!cancelled) setState('failed');
            });

        return () => {
            cancelled = true;
            rendererRef.current?.dispose();
            rendererRef.current = null;
        };
    }, [src, enabled, strength, focus, invertDepth]);

    useEffect(() => {
        rendererRef.current?.setStrength(strength);
    }, [strength]);
    useEffect(() => {
        rendererRef.current?.setFocus(focus);
    }, [focus]);
    useEffect(() => {
        rendererRef.current?.setInvert(invertDepth);
    }, [invertDepth]);

    useEffect(() => {
        if (state !== 'ready') return;
        const wrap = wrapRef.current;
        const canvas = canvasRef.current;
        if (!wrap || !canvas) return;

        const ro = new ResizeObserver(() => {
            const r = rendererRef.current;
            if (!r) return;
            const dpr = window.devicePixelRatio || 1;
            const rect = wrap.getBoundingClientRect();
            r.setSize(Math.max(1, Math.round(rect.width * dpr)), Math.max(1, Math.round(rect.height * dpr)));
            r.draw(currentRef.current.x, currentRef.current.y);
        });
        ro.observe(wrap);

        const io = new IntersectionObserver(
            (entries) => {
                visibleRef.current = entries[0]?.isIntersecting ?? false;
                if (visibleRef.current) tick();
            },
            { rootMargin: IO_MARGIN }
        );
        io.observe(wrap);

        const tick = () => {
            const r = rendererRef.current;
            if (!r) return;
            const t = targetRef.current;
            const c = currentRef.current;
            c.x += (t.x - c.x) * LERP;
            c.y += (t.y - c.y) * LERP;
            r.draw(c.x, c.y);
            const settled = Math.abs(t.x - c.x) < EPSILON && Math.abs(t.y - c.y) < EPSILON;
            if (settled && !hoveringRef.current) {
                rafRef.current = null;
                return;
            }
            if (!visibleRef.current) {
                rafRef.current = null;
                return;
            }
            rafRef.current = requestAnimationFrame(tick);
        };

        const wake = () => {
            if (rafRef.current === null && visibleRef.current) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };

        const onMove = (e: PointerEvent) => {
            const rect = wrap.getBoundingClientRect();
            const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
            targetRef.current.x = Math.max(-1, Math.min(1, nx));
            targetRef.current.y = Math.max(-1, Math.min(1, ny));
            hoveringRef.current = true;
            wake();
        };
        const onLeave = () => {
            hoveringRef.current = false;
            targetRef.current.x = 0;
            targetRef.current.y = 0;
            wake();
        };

        wrap.addEventListener('pointermove', onMove);
        wrap.addEventListener('pointerleave', onLeave);

        // initial draw
        wake();

        return () => {
            ro.disconnect();
            io.disconnect();
            wrap.removeEventListener('pointermove', onMove);
            wrap.removeEventListener('pointerleave', onLeave);
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [state]);

    return { canvasRef, wrapRef, state };
};
