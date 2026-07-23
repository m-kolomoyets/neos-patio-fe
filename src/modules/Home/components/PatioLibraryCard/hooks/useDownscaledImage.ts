import { useCallback, useEffect, useRef } from 'react';
import { HOME_SCROLL_ROOT_SELECTOR } from '../../../constants';

// Source previews are large (~1536x1024). The card paints them into a tiny box,
// so letting the browser downscale in one pass aliases fine detail -> moire.
// We pre-shrink with multi-step halving on a canvas (area-average quality) and
// paint the result directly into a <canvas>, which is cheaper than re-encoding
// to a blob (no encode + second decode round-trip).

const BOX_WIDTH = 480;
const BOX_HEIGHT = 320;
const PARALLAX_OVERSHOOT = 1;
const MAX_DPR = 2;

// Cap concurrent full-resolution decodes. Each decoded source is ~6MB RGBA in
// flight; without a cap a screen full of cards spikes memory and janks.
const MAX_CONCURRENT = 3;

type Task = () => Promise<void>;

let active = 0;
const queue: Task[] = [];

const release = () => {
    active -= 1;
    pump();
};

const pump = () => {
    while (active < MAX_CONCURRENT && queue.length > 0) {
        const task = queue.shift()!;
        active += 1;
        void task().finally(release);
    }
};

const enqueue = (task: Task) => {
    queue.push(task);
    pump();
};

// Downscaled results, reused across remounts (scroll away + back). Keyed by
// source url + target pixel size. Values are kept open (not closed) on purpose.
const cache = new Map<string, ImageBitmap>();

const coverSize = (sw: number, sh: number, tw: number, th: number) => {
    const scale = Math.max(tw / sw, th / sh);
    return { w: Math.round(sw * scale), h: Math.round(sh * scale) };
};

// Repeatedly halve until within 2x of the target, then a final exact step. Each
// step is a smooth 2x reduction, which avoids the single-pass aliasing.
const downscale = (source: CanvasImageSource, sw: number, sh: number, tw: number, th: number): HTMLCanvasElement => {
    let curW = sw;
    let curH = sh;
    let src: CanvasImageSource = source;

    const step = (nextW: number, nextH: number): HTMLCanvasElement => {
        const c = document.createElement('canvas');
        c.width = nextW;
        c.height = nextH;
        const ctx = c.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(src, 0, 0, nextW, nextH);
        return c;
    };

    while (curW > tw * 2 || curH > th * 2) {
        const nextW = Math.max(tw, Math.round(curW / 2));
        const nextH = Math.max(th, Math.round(curH / 2));
        src = step(nextW, nextH);
        curW = nextW;
        curH = nextH;
    }

    return step(tw, th);
};

type Params = {
    /** Full-resolution preview (always present). */
    url: string;
    /** Tiny blurred placeholder, painted instantly while the full one decodes. */
    lowUrl?: string;
    /** Accessible label for the canvas (replaces <img alt>). */
    alt: string;
};

// Start decoding a bit before the card scrolls into view.
const IO_ROOT_MARGIN = '20% 0px';

export const useDownscaledImage = ({ url, lowUrl, alt }: Params) => {
    const canvasElRef = useRef<HTMLCanvasElement | null>(null);
    const generationRef = useRef(0);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const startedRef = useRef(false);

    const paint = useCallback((bitmap: ImageBitmap) => {
        const canvas = canvasElRef.current;
        if (!canvas) {
            return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        const cw = canvas.width;
        const ch = canvas.height;
        const { w, h } = coverSize(bitmap.width, bitmap.height, cw, ch);
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(bitmap, (cw - w) / 2, (ch - h) / 2, w, h);
    }, []);

    const run = useCallback(() => {
        const canvas = canvasElRef.current;
        if (!canvas) {
            return;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        const targetW = Math.round(BOX_WIDTH * dpr);
        const targetH = Math.round(BOX_HEIGHT * PARALLAX_OVERSHOOT * dpr);
        canvas.width = targetW;
        canvas.height = targetH;

        const key = `${url}@${targetW}x${targetH}`;
        const cached = cache.get(key);
        if (cached) {
            paint(cached);
            return;
        }

        const generation = (generationRef.current += 1);

        // Instant blurred placeholder while the full image decodes.
        if (lowUrl) {
            void createImageBitmap2(lowUrl)
                .then((bmp) => {
                    if (!bmp) {
                        return;
                    }
                    if (generation === generationRef.current && !cache.has(key)) {
                        paint(bmp);
                    }
                    bmp.close();
                })
                .catch(noopError);
        }

        enqueue(async () => {
            if (generation !== generationRef.current) {
                return;
            }
            const source = await createImageBitmap2(url);
            if (!source) {
                return;
            }
            const cover = coverSize(source.width, source.height, targetW, targetH);
            const canvasResult = downscale(source, source.width, source.height, cover.w, cover.h);
            source.close();

            const result = await createImageBitmap(canvasResult);
            cache.set(key, result);

            if (generation === generationRef.current) {
                paint(result);
            }
        });
    }, [url, lowUrl, paint]);

    const canvasRef = useCallback(
        (el: HTMLCanvasElement | null) => {
            observerRef.current?.disconnect();
            observerRef.current = null;
            canvasElRef.current = el;

            if (!el) {
                return;
            }

            el.setAttribute('role', 'img');
            el.setAttribute('aria-label', alt);

            // Already processed (remount / ref re-fire) -> repaint from cache now.
            if (startedRef.current) {
                run();
                return;
            }

            const root = document.querySelector<HTMLElement>(HOME_SCROLL_ROOT_SELECTOR);
            const observer = new IntersectionObserver(
                (entries) => {
                    if (
                        !entries.some((entry) => {
                            return entry.isIntersecting;
                        })
                    ) {
                        return;
                    }
                    startedRef.current = true;
                    observer.disconnect();
                    observerRef.current = null;
                    run();
                },
                { root, rootMargin: IO_ROOT_MARGIN, threshold: 0 }
            );
            observer.observe(el);
            observerRef.current = observer;
        },
        [alt, run]
    );

    useEffect(() => {
        return () => {
            observerRef.current?.disconnect();
            observerRef.current = null;
            // Invalidate any in-flight paint for the unmounted element.
            generationRef.current += 1;
        };
    }, []);

    return { canvasRef };
};

const noopError = () => {
    /* swallow placeholder load failure */
};

// fetch -> blob -> bitmap. Decode happens off the main thread. Returns null on
// failure so the canvas just stays on its placeholder/empty state.
const createImageBitmap2 = async (src: string): Promise<ImageBitmap | null> => {
    try {
        const res = await fetch(src, { mode: 'cors' });
        if (!res.ok) {
            return null;
        }
        const blob = await res.blob();
        return await createImageBitmap(blob);
    } catch {
        return null;
    }
};
