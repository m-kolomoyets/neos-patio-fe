import type { EngineType, ScrollBodyType } from 'embla-carousel';

/**
 * A custom embla ScrollBody that scrolls the carousel continuously like a marquee at a
 * live, signed velocity. embla's animation loop calls `seek()` every frame and reads
 * `direction()` for its loopers; returning `settled: () => false` keeps the animation
 * running indefinitely. The standard `scroll`/`slidesInView` events still fire from the
 * engine's render step, so the existing video scrubs keep working.
 *
 * `getVelocity` returns px/frame in embla's location space (negative = forward / next).
 */
export const createMarqueeScrollBody = (engine: EngineType, getVelocity: () => number): ScrollBodyType => {
    const { location, previousLocation, target, index, indexPrevious, scrollTarget, eventHandler, limit } = engine;

    let velocity = 0;

    const noop = (): ScrollBodyType => {
        return self;
    };

    const seek = (): ScrollBodyType => {
        previousLocation.set(location);
        velocity = getVelocity();
        // Loop is disabled: clamp to the scroll bounds so the marquee can never drift past the
        // first or last slide. constrain() pins location to [limit.min, limit.max].
        location.set(limit.constrain(location.get() + velocity));
        target.set(location);

        // Keep the selected snap (and thus dots/aria) in sync as we drift past snaps.
        const sourceSnap = index.get();
        const targetSnap = scrollTarget.byDistance(0, false).index;
        if (sourceSnap !== targetSnap) {
            indexPrevious.set(sourceSnap);
            index.set(targetSnap);
            eventHandler.emit('select');
        }

        return self;
    };

    const self: ScrollBodyType = {
        direction() {
            return Math.sign(velocity);
        },
        duration() {
            return -1;
        },
        velocity() {
            return velocity;
        },
        settled() {
            return false;
        },
        seek,
        useBaseFriction: noop,
        useBaseDuration: noop,
        useFriction: noop,
        useDuration: noop,
    };

    return self;
};
