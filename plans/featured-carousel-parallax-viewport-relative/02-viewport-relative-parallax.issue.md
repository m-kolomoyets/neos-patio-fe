## What to build

Rewrite `useCarouselParallax` so every slide in the active set (in-view ± 1 neighbour, loop-wrapped) receives a `--parallax-x` value derived from that slide's physical position inside the carousel viewport. Add a pure utility `computeParallaxX` that owns the math — viewport-relative normalisation, clamp, inverted sign, per-slide safe-max derived from stack overhang minus a safety pad — so the hook only handles lifecycle, caches, event wiring, and DOM I/O. Slides outside the active set have their `--parallax-x` stripped on the same tick they drop out. Width and viewport caches refresh only on `reInit` / `resize`; per-frame work is one slide-rect read plus one var write per active slide, batched in read-then-write passes.

## What to build — details

- `computeParallaxX({ slideCenterX, viewportCenterX, viewportHalfWidth, slideWidth, maxPx, scale, safetyPad }) => number`. Pure. No DOM.
- Active set: `computeActiveSet(emblaApi.slidesInView(), total, 1, looped)`. Reuses utility from slice 1.
- Hook owns: `slideWidths: number[]`, `viewportMetrics: { center, halfWidth }`, `prevActive: Set<number>`.
- Event subscriptions: `scroll`, `slidesInView`, `reInit`, `resize`, `settle`. Drop `select`.
- `slidesInView`: rebuild active set, strip `--parallax-x` from `prevActive \ next`, replace `prevActive`.
- `reInit` / `resize`: refresh caches.
- `apply()` on `scroll` / `settle`: read pass (slide rect `x` for each active index) → compute pass (call `computeParallaxX`) → write pass (`setProperty`).
- Sign convention: `translate = -clamp(diff, -1, 1) * min(maxPx, safeMax)` where `diff = (slideCenter - viewportCenter) / viewportHalfWidth` and `safeMax = max(0, slideWidth * (scale - 1) / 2 - safetyPad)`.
- Constants in hook scope: `MAX_TRANSLATE_PX = 48`, `SCALE = 1.25`, `SAFETY_PAD = 4`.
- Cleanup (unmount, `enabled=false`, Embla teardown): strip `--parallax-x` from all slide nodes.
- CSS contract unchanged: `.stack` already consumes `--parallax-x` via `translate3d` and falls back to `0`. Reduced-motion CSS guard already in place.

## Acceptance criteria

- [ ] `computeParallaxX` exists as a pure function with no DOM or framework dependencies
- [ ] `useCarouselParallax` no longer references `scrollProgress` / `scrollSnapList` for diff math
- [ ] Active set rebuilt on `slidesInView` using `computeActiveSet` with radius 1
- [ ] Indices that drop out of the active set get `--parallax-x` removed on the same tick
- [ ] `select` event listener removed; `resize` event listener added
- [ ] Per-frame `apply()` performs all reads before any writes (no interleaving)
- [ ] Cached `slideWidths` and `viewportMetrics` refresh on `reInit` and `resize` only
- [ ] When `enabled=false`: all slide nodes have `--parallax-x` stripped and no listeners remain subscribed
- [ ] Manual: scroll the Home page Featured Patios carousel — every visible card visibly translates its image stack
- [ ] Manual: centred card sits at ~0 translate; edge cards sit near ±safeMax in opposite directions
- [ ] Manual: drag the carousel slowly; parallax tracks drag in real time without stutter
- [ ] Manual: click Next / Prev; all in-view cards animate together during snap
- [ ] Manual: resize across `1024px` / `1279px` / `1439px` breakpoints — no background edges revealed past the image stack
- [ ] Manual: toggle prefers-reduced-motion in OS settings; stack transform reduces to `scale(1.25)` only
- [ ] Manual: loop seam — dragging through wrap point keeps first/last cards updated as neighbours
- [ ] Manual: DevTools Performance during scroll shows no "Forced reflow" warnings in the apply path
- [ ] Manual: a slide that just left the viewport has no `--parallax-x` inline style
- [ ] Edge case: empty data (skeletons) — hook bails cleanly, no errors
- [ ] Edge case: single-slide carousel — active set = `{0}`, parallax stays near zero
- [ ] Edge case: very narrow breakpoint where `slideWidth * 0.125 < 4` — `safeMax` clamps to 0, parallax degrades gracefully
- [ ] `npm run tsc` clean
- [ ] `npm run lint` clean

## Blocked by

- Blocked by `./01-compute-active-set-util.issue.md`
