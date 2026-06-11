## What to build

Rework the Featured Patios carousel auto-scroll from the radial dual-center magnetic field to a half-split model. Hovering the right half of the carousel viewport scrolls forward; the left half scrolls back. Speed ramps linearly with horizontal distance from the center line — zero at center, max at the edge. Detection is confined to the carousel viewport's live rect, so cursor movement over other page content (even while the page is scrolled) never drives the carousel.

End-to-end:

- New pure util `computeHalfScrollSpeed({ cursorX, areaLeft, areaWidth, maxSpeed })` → signed px/frame, `+` = next, `0` at center, `±maxSpeed` at edges, linear, clamped. No DOM, no embla.
- Rework `useCarouselProximityAutoplay`:
  - Source the activation area from the carousel viewport rect (`emblaApi.rootNode().getBoundingClientRect()`).
  - Drop `prevRef` / `nextRef` params.
  - `window` `pointermove`, bounds-checked against the area rect. Y is gate-only (inside vertical bounds = active). Cursor outside the area on either axis → speed 0, marquee stops.
  - Map the util's `+ = next` to embla location space (forward = negative location).
  - Keep the marquee swap-in/out, drag yield (`pointerDown`/`pointerUp`), reInit re-acquisition, settle handoff, snap/dots/aria sync.
- Wire `FeaturedPatios`: stop passing `prevRef`/`nextRef` to the hook; gate `enabled={videoCapable && !reducedMotion}`.

`maxSpeed = 5` px/frame (carried from current `SPEED_MAX`). No minimum-speed floor.

## Acceptance criteria

- [ ] Cursor in right half of viewport scrolls carousel forward; left half scrolls back.
- [ ] Scroll speed increases linearly with distance from center; ~zero near center, fastest near edges.
- [ ] Cursor leaving the viewport area (horizontally or vertically) stops the auto-scroll.
- [ ] Cursor over content below/above the carousel (e.g. Patio Library) does not move the carousel, including after the page is scrolled.
- [ ] Prev/next arrow buttons still click and step the carousel.
- [ ] Patio cards still click through to open.
- [ ] Manual drag still works and auto-scroll yields during drag.
- [ ] Auto-scroll disabled when `reducedMotion` is set; gating also respects `videoCapable`.
- [ ] Selected snap, dots, and aria stay in sync while auto-scrolling.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
