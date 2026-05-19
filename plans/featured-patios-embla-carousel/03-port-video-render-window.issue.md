## What to build

Restore the "mount video for visible card + immediate neighbors" optimization on the Featured Patios carousel using Embla's `slidesInView` event instead of an `IntersectionObserver`. After this slice, only the currently visible cards and their ±1 neighbors mount their video, matching the pre-migration cost profile, with no observer setup in the section component.

End-to-end behavior:

- On every `slidesInView` change (and on `reInit`), recompute the set of slide indices that are in view, expand by ±1 on each side, and expose that set from `useFeaturedCarousel`.
- `FeaturedPatios/index.tsx` passes `shouldMountVideo` to each `FeaturedPatioCard` based on set membership.
- Under reduced-motion or non-`videoCapable` conditions, the set is empty and no card mounts its video.
- No `IntersectionObserver`, `intersectingIds` state, or `renderWindowIds` memo returns to `index.tsx`.

## Acceptance criteria

- [ ] `useFeaturedCarousel` exposes `slidesInViewWithNeighbors: ReadonlySet<number>` (or equivalent named field).
- [ ] The set is updated via `emblaApi.on('slidesInView', ...)` and `on('reInit', ...)`, derived from `emblaApi.slidesInView()` expanded by ±1 against `emblaApi.scrollSnapList()`.
- [ ] When `videoCapable === false` (reduced-motion, slow connection, or no-hover), the exposed set is always empty.
- [ ] `FeaturedPatios/index.tsx` reads the set and passes `shouldMountVideo={set.has(index)}` to each `FeaturedPatioCard`, replacing the previous all-or-none boolean from slice 1.
- [ ] No `IntersectionObserver` instance is created anywhere in this module; the `intersectingIds` and `renderWindowIds` state from the pre-migration code does not return.
- [ ] `npm run tsc` and `npm run lint` pass.
- [ ] Manual browser check confirms: with three or more featured patios, exactly the in-view slides plus immediate neighbors mount their `<video>`; advancing one slide mounts the next neighbor and unmounts the now-distant one; reduced-motion and slow-connection emulation mount zero videos.

## Blocked by

- Blocked by ./01-core-swap-dots-a11y.issue.md
