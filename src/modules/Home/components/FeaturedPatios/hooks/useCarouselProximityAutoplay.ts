import type { EmblaCarouselType, ScrollBodyType } from 'embla-carousel';
import { useCallback, useEffect, useRef } from 'react';
import { computeHalfScrollSpeed } from '../utils/computeHalfScrollSpeed';
import { createMarqueeScrollBody } from '../utils/createMarqueeScrollBody';

type Params = {
    emblaApi: EmblaCarouselType | undefined;
    enabled: boolean;
};

type Result = {
    // Scales marquee speed by BOOST_MULTIPLIER. One-shot: repeat calls are no-ops until unboost.
    boost: () => void;
    // Clears the boost, restoring default speed.
    unboost: () => void;
};

// Marquee velocity magnitude in px/frame at the area edge; ramps from 0 at the center line.
const SPEED_MAX = 12;
const EPSILON = 1e-4;
// Extra px added above and below the carousel wrapper so the magnetic trigger zone reaches
// past the visual bounds vertically. Horizontal extent stays tied to the wrapper rect.
const VERTICAL_TRIGGER_PADDING = 40;
// One-time speed bump applied after the first navigation-arrow click.
const BOOST_MULTIPLIER = 2;

type Rect = { left: number; top: number; width: number; height: number };

export const useCarouselProximityAutoplay = ({ emblaApi, enabled }: Params): Result => {
    // Persist across effect re-runs: the boost is permanent once triggered.
    const boostedRef = useRef(false);
    // Bridges the exposed boost() to the effect-internal recompute so a click takes effect
    // immediately even when the cursor is stationary inside the area.
    const recomputeRef = useRef<(() => void) | null>(null);

    const boost = useCallback(() => {
        if (boostedRef.current) return;
        boostedRef.current = true;
        recomputeRef.current?.();
    }, []);

    const unboost = useCallback(() => {
        if (!boostedRef.current) return;
        boostedRef.current = false;
        recomputeRef.current?.();
    }, []);

    useEffect(
        function configureProximityAutoplay() {
            if (!emblaApi || !enabled) return;

            let area: Rect = { left: 0, top: 0, width: 0, height: 0 };
            let cursorX = 0;
            let cursorY = 0;
            // Signed speed in px/frame from the half-split model: positive scrolls to the next
            // arrow, negative to the prev arrow, zero at the center line or outside the area.
            let speed = 0;
            // True while the user drags the carousel; manual interaction wins over the marquee.
            let isPointerDown = false;
            let running = false;

            // Cache the engine + its default scroll body so the marquee can swap in/out and
            // restore cleanly. Re-acquired on reInit because embla rebuilds the engine.
            let engine = emblaApi.internalEngine();
            let defaultScrollBody: ScrollBodyType = engine.scrollBody;

            const refreshArea = () => {
                const r = emblaApi.rootNode().getBoundingClientRect();
                area = {
                    left: r.left,
                    top: r.top - VERTICAL_TRIGGER_PADDING,
                    width: r.width,
                    height: r.height + VERTICAL_TRIGGER_PADDING * 2,
                };
            };

            // Loop is off: at a scroll boundary, suppress speed that would push further out.
            // Forward (positive speed) drives location toward limit.min; prev toward limit.max.
            const atBlockingBoundary = (): boolean => {
                const loc = engine.location.get();
                if (speed > 0) return engine.limit.reachedMin(loc);
                if (speed < 0) return engine.limit.reachedMax(loc);
                return false;
            };

            const isActive = (): boolean => {
                return Math.abs(speed) > EPSILON && !atBlockingBoundary();
            };

            // Signed px/frame in embla's location space. Forward (next) scrolls toward decreasing
            // location, so a positive `speed` maps to a negative velocity.
            const velocity = (): number => {
                return -speed;
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

            // While the marquee runs it advances location every frame without re-entering
            // recompute; re-check each frame so it halts the moment it reaches a boundary.
            const onScroll = () => {
                if (running && !isActive()) stop();
            };

            const recompute = () => {
                // Re-read the live rect so the area tracks the carousel as the page scrolls.
                refreshArea();
                // Gate on the cursor being inside the area's bounds on both axes; movement over
                // other page content (or beside the carousel) must never drive it.
                const insideX = cursorX >= area.left && cursorX <= area.left + area.width;
                const insideY = cursorY >= area.top && cursorY <= area.top + area.height;
                speed =
                    insideX && insideY
                        ? computeHalfScrollSpeed({
                              cursorX,
                              areaLeft: area.left,
                              areaWidth: area.width,
                              maxSpeed: boostedRef.current ? SPEED_MAX * BOOST_MULTIPLIER : SPEED_MAX,
                          })
                        : 0;
                sync();
            };

            const onPointerMove = (e: PointerEvent) => {
                cursorX = e.clientX;
                cursorY = e.clientY;
                recompute();
            };

            const onResize = () => {
                refreshArea();
                recompute();
            };

            const onReInit = () => {
                running = false;
                engine = emblaApi.internalEngine();
                defaultScrollBody = engine.scrollBody;
                refreshArea();
                recompute();
            };

            const onPointerDown = () => {
                isPointerDown = true;
                // Yield to the drag handler immediately so manual dragging is unobstructed.
                stop();
            };
            const onPointerUp = () => {
                isPointerDown = false;
                // Resume only if the cursor is still inside the active area.
                recompute();
            };

            recomputeRef.current = recompute;
            refreshArea();
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('resize', onResize);
            emblaApi.on('reInit', onReInit);
            emblaApi.on('pointerDown', onPointerDown);
            emblaApi.on('pointerUp', onPointerUp);
            emblaApi.on('scroll', onScroll);

            return () => {
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('resize', onResize);
                emblaApi.off('reInit', onReInit);
                emblaApi.off('pointerDown', onPointerDown);
                emblaApi.off('pointerUp', onPointerUp);
                emblaApi.off('scroll', onScroll);
                recomputeRef.current = null;
                stop();
            };
        },
        [emblaApi, enabled]
    );

    return { boost, unboost };
};
