# Featured Patios — Half-Split Magnetic Scroll

## Problem Statement

On the Home page, the Featured Patios carousel auto-scrolls when the cursor approaches the prev/next arrow buttons. The current behavior is a radial "magnetic field" centered on each arrow button with a fixed radius of action (~225px). This has two problems:

1. The activation zone is small and tied to the arrow buttons, so users have to find and hover near a specific spot to move the carousel.
2. The proximity detection has no spatial bounds tied to the carousel itself. As the page scrolls, the field stays active over unrelated content below the carousel, so cursor movement over other parts of the page can still drive the carousel.

The user wants a simpler, more intentional interaction: hovering anywhere over the left half of the carousel scrolls it back, hovering over the right half scrolls it forward, and the closer the cursor is to the corresponding edge/arrow, the faster it moves — with detection strictly confined to the carousel's own visible area.

## Solution

Replace the radial dual-center magnetic field with a half-split model:

- The carousel viewport is conceptually divided into two halves by its vertical center line.
- When the cursor is inside the carousel's visible area and in the right half, the carousel scrolls forward (toward the next arrow). In the left half, it scrolls back (toward the prev arrow).
- Speed ramps linearly with horizontal distance from the center line: zero at the center, maximum at the area edge. Closer to the arrow = faster.
- The activation area equals the carousel viewport box exactly. Detection is bounds-checked against this area's live rect, which tracks the carousel as the page scrolls — so movement over other page content never drives the carousel.

The existing continuous marquee scroll mechanism, drag-to-scroll yielding, and snap/dots/aria sync are unchanged. Only the proximity-to-velocity model changes.

## User Stories

1. As a Home page visitor, I want to move the cursor over the right half of the featured carousel, so that it scrolls forward to reveal more patios.
2. As a Home page visitor, I want to move the cursor over the left half of the featured carousel, so that it scrolls back to previous patios.
3. As a Home page visitor, I want the carousel to scroll faster as I move the cursor closer to the left or right edge, so that I can control browsing speed by cursor position.
4. As a Home page visitor, I want the carousel to stay still when my cursor is near the center, so that I have a neutral resting zone.
5. As a Home page visitor, I want the carousel to stop scrolling when my cursor leaves its visible area, so that movement only happens when I intend it.
6. As a Home page visitor, I want the carousel to ignore my cursor when it is below or above the carousel (e.g. over the Patio Library section), so that scrolling elsewhere on the page doesn't move the carousel.
7. As a Home page visitor scrolling the page, I want the carousel's active area to move with the carousel, so that the interaction zone always matches what I see.
8. As a Home page visitor, I want to still click the prev/next arrow buttons, so that I can step the carousel discretely.
9. As a Home page visitor, I want to still click a patio card to open it, so that the scroll behavior doesn't block normal interaction.
10. As a Home page visitor, I want to still drag the carousel manually, so that I retain direct control; auto-scroll should yield while I drag.
11. As a user who prefers reduced motion, I want the cursor-driven auto-scroll disabled, so that I'm not subjected to unwanted motion.
12. As a user on a device without video capability, I want behavior consistent with the existing capability gating, so that the experience degrades gracefully.
13. As a Home page visitor, I want the carousel's selected snap, dots, and aria state to stay correct while it auto-scrolls, so that assistive tech and indicators stay in sync.

## Implementation Decisions

### Modules

- **`useCarouselProximityAutoplay` (modified)** — the only behavioral module changing.
  - Drops `prevRef` / `nextRef` params; no longer keys off arrow button centers.
  - Sources the activation area from the carousel viewport rect (`emblaApi.rootNode().getBoundingClientRect()`).
  - Computes a signed velocity from cursor X relative to the area, gated by cursor Y being within the area's vertical bounds.
  - Retains the existing marquee swap-in/swap-out, drag yield (`pointerDown`/`pointerUp`), reInit re-acquisition, and settle handoff.

- **`computeHalfScrollSpeed` (new deep util)** — pure function, the testable core of the model.
  - Input: cursor X, area left edge, area width, max speed.
  - Output: signed magnitude where `+` = forward/next, `0` at center, `±maxSpeed` at edges, linear ramp, clamped.
  - No DOM, no embla — pure math, isolated and stable interface.

- **`FeaturedPatios` (modified)** — `index.tsx`.
  - Stops passing `prevRef` / `nextRef` to the autoplay hook.
  - Changes gating to `enabled={videoCapable && !reducedMotion}`.
  - Removes the commented-out scrub import and call.

### Model details

- Activation area = the carousel viewport box exactly. No new DOM node added; the existing viewport element is the area source. Its rect tracks the carousel as the page scrolls, satisfying the "area attached to the carousel" requirement.
- `t = clamp(|cursorX - centerX| / (areaWidth / 2), 0, 1)`; `centerX = areaLeft + areaWidth / 2`.
- `speed = maxSpeed * t`, linear. Zero at center. No minimum-speed floor.
- `maxSpeed = 5` px/frame (carried over from current `SPEED_MAX`; tune by feel later).
- Direction: cursor right of center → next; left of center → prev. The new util returns `+` for next; the hook maps it to embla's location space (forward = negative location), preserving the existing sign inversion.
- Y handling: gate-only. Cursor inside the area's vertical bounds → active. Cursor outside the area on either axis → speed 0, marquee stops.

### Pointer handling

- Detection stays on a `window` `pointermove` listener, bounds-checked against the live area rect. Pointer events are not captured by any overlay, so cards and arrow buttons keep working normally. No element is given `pointer-events: auto` for this feature.

### Gating

- `enabled = videoCapable && !reducedMotion`. `videoCapable` retained to avoid behavior drift; `!reducedMotion` added as an accessibility improvement (auto-scroll is motion).

### Cleanup

- Delete `useCarouselMagneticScrub.ts` (scrub is retired for good).
- Delete `computeMagneticTarget.ts` (radial dual-center field, no longer used).
- Remove the commented scrub import and hook call in `FeaturedPatios/index.tsx`.

### Unchanged

- `createMarqueeScrollBody` — continuous marquee scroll body.
- Drag yield, reInit re-acquire, settle handoff, snap/dots/aria sync via `select` emission.

## Testing Decisions

This repo has no test runner configured, and project guidance is not to add one unless asked. No automated tests will be added.

Were tests introduced later, the natural target is the pure `computeHalfScrollSpeed` util — it tests external behavior (input cursor/area → signed speed) with no DOM or embla coupling. Edge cases worth covering:

- Cursor exactly at center → 0.
- Cursor at left edge → `-maxSpeed`; at right edge → `+maxSpeed`.
- Cursor beyond either edge → clamped to `±maxSpeed` (not exceeding).
- Midpoints → linear interpolation (e.g. quarter-width from center → `maxSpeed / 2`).
- Zero or negative area width → safe `0` (no divide-by-zero blowup).

Hook-level behavior (window listener bounds-checking, marquee start/stop, drag yield) is integration-shaped and would be verified manually in the running app.

## Out of Scope

- Re-enabling or reworking the video frame scrub (`useCarouselMagneticScrub`) — it is retired.
- Touch / mobile drag behavior changes — manual drag is preserved as-is, not redesigned.
- Visual treatment of the halves (no visible divider, overlay, or cursor affordance is added).
- Changing `videoCapable` capability detection itself.
- Tuning `maxSpeed` beyond carrying the current value forward.
- Adding a test runner or test infrastructure.

## Further Notes

- The image annotation showed the activation box dipping slightly below the cards; the agreed decision is that the area equals the viewport box exactly (the dip was treated as a rough annotation).
- The "fixed positioned / leaks onto other content" bug is addressed by bounds-checking against the carousel viewport's live rect rather than applying an unbounded radial field. The viewport is already a child of the carousel wrapper, so its rect moves with the carousel on page scroll.
- `SPEED_MIN` from the old model is intentionally dropped; with zero speed at center, a continuous ramp from 0 needs no floor.
