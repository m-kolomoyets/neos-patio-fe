# Featured Carousel — Viewport-Relative Parallax for In-View Slides

## Problem Statement

On the Home page Featured Patios carousel, only the currently-selected slide animates with a parallax offset while the carousel scrolls. All other slides — including ones that are partially or fully visible — sit at a flat/clamped offset. This breaks the depth illusion: neighbouring cards remain visually pinned while the active card drifts, making the carousel feel like a single moving card surrounded by static thumbnails instead of a continuous parallax field.

The existing implementation computes parallax from `snapIndex - scrollProgress`, which clamps every off-snap slide at ±1 and saturates them at the maximum translate. It also does not consider where each slide actually sits inside the viewport rectangle, so the visual offset of a card halfway through the viewport bears no relation to its physical position.

## Solution

Apply parallax to every slide that is currently in view, plus one neighbour on each side, with the per-slide offset derived from that slide's physical position inside the viewport. As a slide enters from the right edge, crosses the centre, and exits the left edge, its inner image stack drifts smoothly from one extreme of its parallax range, through zero at viewport-centre, to the opposite extreme. Slides outside the active set get their parallax variable cleared so they sit at neutral and don't carry stale offsets into their next on-screen appearance.

The result: while the user drags or auto-scrolls the carousel, every visible card participates in the parallax — image stacks appear anchored to the world as card frames slide over them, producing the classic depth-shift effect across the entire visible band of the track rather than only the centred card.

## User Stories

1. As a Home-page visitor, I want every visible Featured Patio card to show a parallax depth effect while I scroll the carousel, so that the row feels alive and dimensional instead of one animated card surrounded by flat ones.
2. As a Home-page visitor dragging the carousel with my mouse, I want the parallax on each card to track my drag position smoothly in real time, so that the motion feels physically responsive.
3. As a Home-page visitor clicking the Next/Prev buttons, I want all in-view cards to animate their parallax during the snap transition, so that the transition reads as a coordinated depth pan rather than a single card slide.
4. As a Home-page visitor, I want a card entering from the right viewport edge to begin with its image stack pre-shifted, so that the image appears anchored to the world while the card frame moves over it.
5. As a Home-page visitor, I want the image inside a card centred in the viewport to sit at zero parallax offset, so that the focal card looks crisp and stable.
6. As a Home-page visitor, I want a card exiting to the left viewport edge to end with its image stack shifted in the opposite direction from the entry state, so that the depth illusion holds symmetrically on both sides of centre.
7. As a Home-page visitor, I want the parallax intensity of a card to scale linearly with how far the card sits from viewport-centre, so that the motion feels physically intuitive.
8. As a Home-page visitor, I want neighbour cards just off the viewport edges to also receive parallax updates, so that when they slide in there is no first-frame pop from a stale offset.
9. As a Home-page visitor on a narrow viewport, I want the parallax translate to stay within the inner image stack's overscan area, so that I never see a bare edge of the card revealed past the image.
10. As a Home-page visitor with reduced-motion preference, I want all parallax translation suppressed, so that the carousel respects my OS-level motion settings.
11. As a Home-page visitor on a touch device that does not show hover affordances, I want the parallax disabled when capability gates do not support it, so that I do not see degraded animations on incapable devices.
12. As a Home-page visitor on a slow connection, I want parallax to remain inexpensive and not interfere with image loading, so that the page stays responsive.
13. As a Home-page visitor, I want the parallax to recompute on window resize and breakpoint changes, so that the depth ranges stay correct when slide widths change.
14. As a Home-page visitor in a looping carousel, I want neighbour parallax updates to wrap correctly across the seam between the last and first slide, so that the cards that wrap remain coherent.
15. As a developer maintaining the carousel, I want the parallax math expressed as a pure function, so that I can reason about and verify the mapping from viewport position to translate offset without running the app.
16. As a developer maintaining the carousel, I want the active-set computation (in-view ± neighbour radius, with loop wrap) extracted as a pure function, so that the same membership rule can be reused by other view-window concerns (e.g. video mount) without duplication.
17. As a developer maintaining the carousel, I want the hook to avoid layout thrash, so that scrolling stays at 60fps on mid-range hardware.
18. As a developer maintaining the carousel, I want CSS variables stripped from slides that leave the active set, so that stale offsets do not survive into the next entry.

## Implementation Decisions

### Modules

Three modules are involved. Two are new pure utilities, the third is the existing parallax hook being substantially rewritten.

- **`computeParallaxX` — new pure utility.** Inputs: slide centre x, viewport centre x, viewport half-width, slide width, max translate cap, stack scale factor. Output: translate value in pixels, ready to write into `--parallax-x`. Encapsulates: viewport-relative normalisation, clamp to [-1, 1], inverted sign (so image appears anchored to world), per-slide safe-max derived from stack overhang minus a safety pad. Single-responsibility, no DOM access, fully deterministic.

- **`computeActiveSet` — new pure utility.** Inputs: in-view indices, total slide count, neighbour radius, loop flag. Output: `ReadonlySet<number>` of indices whose parallax should be tracked. Encapsulates: neighbour expansion and loop wrap-around. Shared between `useCarouselParallax` (radius 1) and `useFeaturedCarousel`'s existing `slidesInViewWithNeighbors` logic (radius 2), replacing the duplicated inline loop currently in `useFeaturedCarousel`.

- **`useCarouselParallax` — existing hook, rewritten.** Owns: Embla event subscription, width/viewport caches, per-frame `apply()` pass, previous-active-set tracking for cleanup of dropped indices, lifecycle teardown. Delegates math to `computeParallaxX` and set membership to `computeActiveSet`.

### Active set

- Active set = `slidesInView()` expanded by ±1 neighbour, with wrap when `loop` is enabled.
- Rebuilt on Embla `slidesInView` event and on `reInit`.
- Previous set is retained across rebuilds. On change, the symmetric difference is computed and indices removed from the new set have their `--parallax-x` stripped.
- Active set is owned internally by `useCarouselParallax`. Not lifted out: the video-mount window (`useFeaturedCarousel`) uses a different radius and should remain decoupled from parallax. However, both call sites move to using the shared `computeActiveSet` utility for the expansion + wrap logic.

### Position math

- For each active slide: `diff = (slideRect.center.x - viewportRect.center.x) / (viewportRect.width / 2)`.
- Clamp `diff` to `[-1, +1]`.
- `safeMax = max(0, slideWidth * (scale - 1) / 2 - safetyPad)` where `scale = 1.25` (from `.stack` transform) and `safetyPad = 4px`. Cap at a global `MAX_TRANSLATE_PX = 48`.
- Final translate: `-clamped * min(MAX_TRANSLATE_PX, safeMax)`. Negative sign yields the "image anchored to world" direction (left side of viewport → image translated right within card; right side → image translated left).
- Easing is linear. Parallax is a physical positional mapping; introducing curves would decouple visual offset from intuitive viewport position.

### Caches

- `slideWidths: number[]` — populated on `reInit` and `resize`, indexed by slide index.
- `viewportMetrics: { center: number; halfWidth: number }` — recomputed on the same events.
- Width and viewport reads happen only on resize-class events; per-frame work only reads slide rect `x` to derive centre.

### Per-frame `apply()` ordering

To avoid forced reflow from interleaved reads and writes:

1. Read pass: viewport rect is cached; for each active index, read `slide.getBoundingClientRect().x` (and width if cache missing).
2. Compute pass: apply `computeParallaxX` per index. Result stored in a small local array keyed by index.
3. Write pass: iterate results, `node.style.setProperty('--parallax-x', value.toFixed(2))`.

### Event wiring

Subscribed Embla events:

- `scroll` — per-frame position update.
- `slidesInView` — active set rebuild + dropped-index cleanup.
- `reInit` — full cache rebuild + active set rebuild.
- `resize` — viewport + width cache refresh.
- `settle` — final-frame correctness pass (cheap, guarantees last position written).

Dropped: `select` — snap-index changes are irrelevant once parallax derives from physical slide position rather than snap-vs-progress.

### CSS contract

- `.stack` in `FeaturedPatioCard/styles.module.css` already consumes `--parallax-x` via `translate3d(calc(var(--parallax-x, 0) * 1px), 0, 0) scale(1.25)`.
- The default `0` keeps the contract safe when the variable is absent (slide outside active set, hook disabled, or motion suppressed).
- Reduced-motion media query in the same file forces `transform: scale(1.25)` regardless, providing a CSS-side guard in addition to the hook's `enabled` gate.

### Capability gating

The hook honours its existing `enabled` param. `useFeaturedCarousel` will continue to pass `enabled: !reducedMotion`, so parallax is suppressed for reduced-motion users. Other capability gates (slow connection, no-hover) currently apply only to video mount and remain unchanged — parallax stays on for those users since it is CSS-transform-only and cheap.

### Cleanup

On `enabled` flip to false, on Embla teardown, on hook unmount: iterate `slideNodes()` and remove `--parallax-x`.

## Testing Decisions

This repository has no test runner configured (per `CLAUDE.md`) and no test runner will be introduced. Verification will be manual.

Pure utilities are extracted specifically to make the logic auditable by reading: `computeParallaxX` and `computeActiveSet` have no DOM or framework dependencies, so correctness can be reasoned about from their signatures and bodies alone.

### Manual verification checklist

- Carousel with reduced-motion off: every visible card visibly translates its image stack as the carousel scrolls; centred card sits at zero; edge cards sit near max in opposite directions.
- Drag the carousel slowly: parallax tracks drag in real time, no stutter.
- Click Next/Prev: all in-view cards animate in coordination during the snap.
- Resize the window across the `1024px` / `1279px` / `1439px` breakpoints: parallax does not reveal background edges past the image stack (safe-max guard).
- Toggle prefers-reduced-motion in OS settings: stack transform reduces to `scale(1.25)` only, no translate.
- Loop seam: drag through the wrap point with looping enabled; first/last cards continue to receive parallax updates as neighbours.
- Open DevTools Performance: scroll the carousel; verify no "Forced reflow" warnings in the apply path.
- Inspect a slide that just left the viewport: confirm `style="--parallax-x: …"` was removed from the slide node.

### Edge cases to verify by hand

- Empty data state (skeletons): hook bails cleanly, no errors.
- Single-slide carousel: active set = {0}, parallax stays near zero.
- Carousel where every slide fits in viewport at once: all indices in active set, all parallax-x values valid.
- Very narrow viewport where `slideWidth * 0.125 < 4`: `safeMax` clamps to 0, parallax effectively disabled on that breakpoint (acceptable degradation).

## Out of Scope

- Y-axis parallax. The carousel scrolls horizontally; vertical parallax is not part of this change.
- Hover-driven micro-parallax (mouse-tracking tilt inside an individual card). The spotlight effect already covers this concern.
- Video-mount window radius. The existing `slidesInViewWithNeighbors` set in `useFeaturedCarousel` (radius 2) stays at radius 2. Only its expansion implementation is replaced by `computeActiveSet`.
- Per-layer parallax depth (e.g. different translate amounts for `img-low`, `img-high`, `video` within `.stack`). All layers move together via the parent `.stack` transform.
- Configurable max-translate / scale / sign — values are fixed constants in this change.
- Adding tests or a test runner.
- Changes to `FeaturedPatioCard/styles.module.css` beyond what is already in place (CSS contract is unchanged from the prior commit).

## Further Notes

- The previous x-parallax implementation (commit `83059cc`) was removed in `050795f` in favour of position-driven video frame snap. This PRD reintroduces x-parallax as a separate concern from the video frame snap; the two coexist (frame snap drives `currentTime`, parallax drives `transform`).
- `computeActiveSet` extraction is a small refactor of `useFeaturedCarousel.ts` (lines ~100–134). The radius and loop flag remain configurable per call site; the utility encapsulates only the expansion + wrap logic.
- `MAX_TRANSLATE_PX = 48`, `safetyPad = 4`, `scale = 1.25` are kept as module-local constants in the hook and passed into `computeParallaxX` so the utility has no implicit coupling to the CSS.
- The hook continues to write CSS variables on `slideNodes()` (the `.slide` flex children, parents of `<Link>`). CSS custom properties inherit, so `.stack` inside the link consumes them transparently.
