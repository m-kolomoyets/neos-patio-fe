## What to build

The end-to-end tracer: an invisible magnetic radial field around each nav button that continuously scrubs the in-view video by cursor proximity. Cursor near the next button scrubs the video forward; near prev, backward; closer = faster. Leaving the field coasts the scrub to a stop.

Introduce `useCarouselMagneticScrub({ emblaApi, prevRef, nextRef, enabled })` in the `FeaturedPatios` module, sibling to `useCarouselVideoScrub`. Wire `ref`s onto the two nav buttons in the module index and call the hook gated on `videoCapable`. The hook listens to `window` `pointermove`, recomputes a `target` velocity via `computeMagneticTarget`, runs a single rAF integrator (`v += (target - v) * k`), and each frame advances the in-view video's `currentTime` by `v · duration · dt` wrapped via `wrapTime`. Button-center rects cached and refreshed on `resize`/embla `reInit`. The rAF loop runs only while `target ≠ 0 || |v| > ε` and cancels otherwise (no idle frames).

This slice may target a single in-view video (the centered one) to stay thin; multi-video fan-out is slice 03.

## Acceptance criteria

- [ ] `useCarouselMagneticScrub` exists with the `{ emblaApi, prevRef, nextRef, enabled }` interface, returns void
- [ ] Nav buttons carry refs wired to `prevRef`/`nextRef`; hook called with `enabled: videoCapable`
- [ ] Cursor entering the next field scrubs the video forward; prev field scrubs backward; magnitude grows with proximity
- [ ] Mid-point between overlapping fields produces no net scrub
- [ ] Scrub ramps up smoothly on entry and coasts/decays to a stop on exit (lerp integrator)
- [ ] Video timeline wraps seamlessly at both ends (no stick)
- [ ] rAF loop is inert when cursor is away and `|v| < ε` (no continuous frames at idle)
- [ ] Hook is fully inert when `enabled` is false
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #plans/featured-carousel-magnetic-scrub/01-magnetic-math-utils.issue.md
