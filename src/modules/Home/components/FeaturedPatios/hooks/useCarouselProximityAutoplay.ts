import type { EmblaCarouselType, ScrollBodyType } from 'embla-carousel';
import { useEffect } from 'react';
import { computeMagneticTarget } from '../utils/computeMagneticTarget';
import { createMarqueeScrollBody } from '../utils/createMarqueeScrollBody';

type Params = {
    emblaApi: EmblaCarouselType | undefined;
    prevRef: React.RefObject<HTMLElement | null>;
    nextRef: React.RefObject<HTMLElement | null>;
    enabled: boolean;
};

// Shared with the magnetic scrub so the autoplay zone matches the scrub zone exactly.
const RADIUS_PX = 225;
// Marquee velocity magnitude in px/frame: lazy drift at the zone edge, brisk on the arrow.
const SPEED_MIN = 1.1;
const SPEED_MAX = 5;
const EPSILON = 1e-4;

type Center = { x: number; y: number };

export const useCarouselProximityAutoplay = ({ emblaApi, prevRef, nextRef, enabled }: Params): void => {
    useEffect(
        function configureProximityAutoplay() {
            if (!emblaApi || !enabled) return;

            let prevCenter: Center = { x: 0, y: 0 };
            let nextCenter: Center = { x: 0, y: 0 };
            let cursorX = 0;
            let cursorY = 0;
            // Signed proximity in [-1, 1]: positive near the next arrow, negative near the prev arrow.
            let proximity = 0;
            // True while the user drags the carousel; manual interaction wins over the marquee.
            let isPointerDown = false;
            let running = false;

            // Cache the engine + its default scroll body so the marquee can swap in/out and
            // restore cleanly. Re-acquired on reInit because embla rebuilds the engine.
            let engine = emblaApi.internalEngine();
            let defaultScrollBody: ScrollBodyType = engine.scrollBody;

            const refreshCenters = () => {
                const prevEl = prevRef.current;
                const nextEl = nextRef.current;
                if (prevEl) {
                    const r = prevEl.getBoundingClientRect();
                    prevCenter = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
                }
                if (nextEl) {
                    const r = nextEl.getBoundingClientRect();
                    nextCenter = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
                }
            };

            const magnitude = (): number => {
                return Math.abs(proximity);
            };
            const isActive = (): boolean => {
                return magnitude() > EPSILON;
            };

            // Signed px/frame in embla's location space. Forward (next) scrolls toward decreasing
            // location, so a positive `proximity` maps to a negative velocity.
            const velocity = (): number => {
                const mag = SPEED_MIN + (SPEED_MAX - SPEED_MIN) * Math.min(1, magnitude());
                return proximity >= 0 ? -mag : mag;
            };

            const play = () => {
                if (running) return;
                engine.scrollBody = createMarqueeScrollBody(engine, velocity);
                engine.animation.start();
                running = true;
            };

            const stop = () => {
                if (!running) return;
                // Restore the default body; with target === location it settles next frame and
                // the engine stops the animation and emits 'settle' (handing video back to scrubs).
                engine.scrollBody = defaultScrollBody;
                running = false;
            };

            const sync = () => {
                if (isPointerDown || !isActive()) {
                    stop();
                    return;
                }
                play();
            };

            const recompute = () => {
                proximity = computeMagneticTarget({
                    cursorX,
                    cursorY,
                    prevCenter,
                    nextCenter,
                    radius: RADIUS_PX,
                    maxRate: 1,
                });
                sync();
            };

            const onPointerMove = (e: PointerEvent) => {
                cursorX = e.clientX;
                cursorY = e.clientY;
                recompute();
            };

            const onResize = () => {
                refreshCenters();
                recompute();
            };

            const onReInit = () => {
                running = false;
                engine = emblaApi.internalEngine();
                defaultScrollBody = engine.scrollBody;
                refreshCenters();
                recompute();
            };

            const onPointerDown = () => {
                isPointerDown = true;
                // Yield to the drag handler immediately so manual dragging is unobstructed.
                stop();
            };
            const onPointerUp = () => {
                isPointerDown = false;
                // Resume only if the cursor is still inside the magnetic zone.
                recompute();
            };

            refreshCenters();
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('resize', onResize);
            emblaApi.on('reInit', onReInit);
            emblaApi.on('pointerDown', onPointerDown);
            emblaApi.on('pointerUp', onPointerUp);

            return () => {
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('resize', onResize);
                emblaApi.off('reInit', onReInit);
                emblaApi.off('pointerDown', onPointerDown);
                emblaApi.off('pointerUp', onPointerUp);
                stop();
            };
        },
        [emblaApi, enabled, prevRef, nextRef]
    );
};
