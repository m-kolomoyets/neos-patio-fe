## What to build

Restore the per-card parallax effect on the Featured Patios carousel by rewriting `useCarouselParallax` to consume Embla's API instead of native scroll mechanics. After this slice, dragging or navigating the carousel produces the same tactile media-translation as before slice 1, but the hook no longer touches `scrollLeft` or a manual snap registry.

End-to-end behavior:

- As the user drags or arrows/dots advance the carousel, each card's media element translates proportionally to its distance from the selected snap, producing a subtle parallax.
- The effect is skipped entirely under `prefers-reduced-motion`.
- The hook subscribes to Embla's `scroll` and `reInit` events; no extra `requestAnimationFrame` layer is added on top of Embla's internal batching.
- No prop or callback is added back to `FeaturedPatioCard` — slide nodes are read from `emblaApi.slideNodes()`.

## Acceptance criteria

- [ ] `useCarouselParallax` signature is `({ emblaApi, enabled }: { emblaApi: EmblaCarouselType | undefined; enabled: boolean })` (or equivalent); previous `viewportRef` / `dataKey` parameters are gone.
- [ ] The hook subscribes to `emblaApi.on('scroll', ...)` and `emblaApi.on('reInit', ...)`, and unsubscribes on cleanup.
- [ ] Per-slide transforms are derived from `emblaApi.scrollProgress()` combined with `emblaApi.scrollSnapList()` / slide positions, and applied directly to nodes from `emblaApi.slideNodes()`.
- [ ] When `enabled === false` (reduced-motion or any other gate), no event subscriptions are made and no transforms are written.
- [ ] `FeaturedPatios/index.tsx` calls the new hook with the Embla API exposed by `useFeaturedCarousel` and gates `enabled` on the same reduced-motion signal already in the hook.
- [ ] `FeaturedPatioCard` props remain free of `registerSnap` or any new parallax callback.
- [ ] No new `requestAnimationFrame` wrapper around the scroll handler.
- [ ] `npm run tsc` and `npm run lint` pass.
- [ ] Manual browser check confirms parallax matches the pre-migration behavior on drag and on arrow/dot navigation; reduced-motion emulation shows no parallax.

## Blocked by

- Blocked by ./01-core-swap-dots-a11y.issue.md
