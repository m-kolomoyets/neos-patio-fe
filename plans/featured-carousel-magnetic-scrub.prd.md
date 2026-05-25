# Featured Carousel — Magnetic Nav-Button Video Scrub

## Problem Statement

The featured-patio carousel has prev/next navigation buttons that only do one thing: a discrete jump to the previous/next slide on click. The interaction is binary and lifeless. There is no sense that the buttons are "live" or that the videos in view are responsive to the user's intent to move. Users approaching a nav button get no anticipatory feedback — nothing communicates direction or momentum until they commit to a click.

## Solution

Each nav button gains an invisible **magnetic radial field** (~225px radius) around it. When the cursor enters a button's field, the videos currently in view begin to **continuously scrub** their timeline in that button's direction — the next button scrubs videos forward, the prev button scrubs them backward. The closer the cursor is to a button, the faster the scrub. Walking the cursor across the gap between both fields produces a smooth gradient (the two fields' contributions sum, cancelling near the middle). When the cursor leaves the field, the scrub velocity coasts down and decays to a stop. This gives the buttons an anticipatory, physical, "alive" quality without moving the carousel itself.

## User Stories

1. As a desktop visitor, I want the videos in the featured carousel to react as my cursor nears the next button, so that I get a live preview of forward motion before I click.
2. As a desktop visitor, I want the videos to scrub backward as my cursor nears the prev button, so that direction is communicated intuitively.
3. As a desktop visitor, I want the scrub to get stronger the closer I am to a button, so that proximity feels like a physical magnetic pull.
4. As a desktop visitor, I want the scrub to start gently at the edge of the field and intensify near the button, so that the effect feels eased rather than abrupt (t² falloff).
5. As a desktop visitor, I want all videos currently in the viewport to scrub together, so that the whole carousel feels responsive, not just one card.
6. As a desktop visitor, I want the video to keep scrubbing continuously while my cursor lingers in the field, so that the motion feels alive rather than a frozen single-frame offset.
7. As a desktop visitor, I want a video that reaches its end while scrubbing forward to wrap seamlessly to its start (and vice versa for backward), so that the continuous motion never sticks or dead-stops.
8. As a desktop visitor, I want the scrub to ramp up smoothly when I enter the field, so that there is no jarring velocity jump.
9. As a desktop visitor, I want the scrub to coast and decay to a stop when I leave the field, so that the motion ends with natural momentum instead of snapping.
10. As a desktop visitor, I want the area between the two button fields to feel neutral, so that standing in the middle does not yank videos in a confusing direction.
11. As a desktop visitor, I want the magnetic scrub to not fight the existing scroll-driven scrub when I actually click a button and the carousel animates, so that the slide transition stays clean.
12. As a desktop visitor, I want cards that are still playing their intro animation to be left alone by the magnetic scrub, so that intro playback is not interrupted.
13. As a user on a touch device or a device without a hover-capable pointer, I do not want this effect to run, so that no resources are wasted on an interaction I cannot perform.
14. As a user who prefers reduced motion, I do not want the magnetic scrub to run, so that my motion preference is respected.
15. As a user on a slow connection, I do not want the magnetic scrub to run, so that bandwidth and decode budget are conserved.
16. As a user of a low-power device, I want the scrub effect to idle (no animation frames) when my cursor is away from the buttons and nothing is in motion, so that battery and CPU are not drained.
17. As a maintainer, I want the magnetic scrub isolated in its own hook with a small interface, so that it can be reasoned about and changed independently of carousel and card logic.
18. As a maintainer, I want the proximity→velocity math and the field-overlap summation extracted as pure functions, so that the non-trivial behavior is verifiable in isolation.

## Implementation Decisions

### New hook: `useCarouselMagneticScrub`

- A new hook scoped to the `FeaturedPatios` module, sibling to `useCarouselVideoScrub`.
- Interface (object args, per repo convention is positional for query hooks but this is a UI hook): `{ emblaApi, prevRef, nextRef, enabled }`. Returns `void`.
- `enabled` is driven by `videoCapable` from `useFeaturedCarousel` (hover-capable pointer + not slow connection + not reduced motion). When false, the hook is fully inert.
- The two nav buttons in `FeaturedPatios` index receive `ref`s wired to `prevRef` / `nextRef`.

### Relationship to existing scroll scrub (offset-on-baseline → continuous rate)

- The existing `useCarouselVideoScrub` remains the **baseline owner** of `video.currentTime`: it writes `dataset.scrubTime` and seeks based on slide-center vs viewport-center on `scroll`/`settle`/`slidesInView`.
- The magnetic hook layers a **continuous velocity** on top. Because the carousel is idle most of the time (it does not move except on click), the baseline is effectively a fixed per-slide frame, and the magnetic velocity drives `currentTime` away from it.
- Coexistence: while the carousel is in motion (between embla `pointerDown`/`scroll` and `settle`), the magnetic hook **suspends** and lets the scroll scrub own `currentTime`. It resumes on `settle`. Tracked via an `isScrolling` flag from embla events.

### Velocity model (continuous rate, unified lerp integrator)

- Single `requestAnimationFrame` integrator holds a live velocity `v`.
- Each frame: `v += (target - v) * k`, with `k ≈ 0.12`. This produces smooth acceleration on entry and, with `target = 0`, the coast-and-decay on exit — one mechanism for both.
- `target` velocity is recomputed on `pointermove`:
  - For each button, distance `d` from cursor to button **center** (euclidean), radius `R = 225px`, strength `t = clamp(1 - d/R, 0, 1)`.
  - Per-button contribution magnitude `= t² · MAX_RATE`, where `MAX_RATE = 0.08` (fraction of video duration per second). Next button = positive, prev button = negative.
  - **Net sum**: `target = nextContribution − prevContribution`. Overlapping fields cancel toward the middle, producing a continuous gradient.
- Per frame, per in-view video: `currentTime += v · thatVideo.duration · dt`. The `t²` factor lives in `target`; `duration` is applied per-video so visual travel is consistent across clips of differing length.
- **Boundary**: `currentTime` wraps modulo `duration` (forward `duration→0`, backward `0→duration`) so scrub never sticks at an end.

### Which videos scrub

- Only `emblaApi.slidesInView()` videos (typically ≤3). Hard cap at **3** simultaneously-scrubbing videos as a safety clamp.
- Per-slide **phase gate**: skip any slide whose card `data-phase !== 'idle'` (mirrors existing scroll scrub; avoids fighting intro playback).

### Geometry & lifecycle

- Button-center rects cached via `getBoundingClientRect`, refreshed on `resize` and embla `reInit`. Buttons are absolutely positioned relative to the viewport, so scroll does not move them.
- `pointermove` on `window` stores cursor x/y and recomputes `target`.
- **rAF gating**: the animation loop runs only while `target ≠ 0 || |v| > ε`. When the cursor leaves all fields, `target → 0`, `v` lerps down, and the loop cancels once `|v| < ε`. No idle-frame burn.

### Per-frame seek cost guards (reuse existing pattern)

- Setting `currentTime` triggers an async seek + decode; mid-seek writes are dropped. Reuse the guards from `useCarouselVideoScrub` per video:
  - skip if `video.seeking`
  - min seek interval throttle (~1/30s)
  - min seek delta `0.03s`
  - integrate `v · duration · dt` into a per-video float accumulator; commit to `currentTime` only when guards pass and keep the remainder, so velocity stays continuous while actual seeks are throttled.

### Extracted pure functions (deep, testable)

- `computeMagneticTarget({ cursorX, cursorY, prevCenter, nextCenter, radius, maxRate })` → signed target velocity (fraction-of-duration per second). Encapsulates distance, t² falloff, and net-sum overlap in one rarely-changing interface.
- A small velocity-integration step helper may be extracted if it clarifies testing: `(v, target, k) => v'` and a `wrapTime(time, duration)` helper for modulo wrapping.

## Testing Decisions

- **No test runner exists in this repo** (per CLAUDE.md, no test runner is configured and none should be added unless asked). Therefore no test files are written as part of this PRD.
- The design nonetheless isolates the non-trivial math into **pure functions** (`computeMagneticTarget`, `wrapTime`, the lerp step) so that if/when a runner is introduced, these are unit-testable in isolation against external behavior only (inputs → output value), not implementation details.
- Were tests added, the high-value cases would be:
  - `computeMagneticTarget`: cursor exactly on a button center → magnitude `MAX_RATE` with correct sign; cursor at field edge (`d = R`) → `0`; cursor outside both fields → `0`; cursor equidistant between overlapping fields → net `~0`; t² shape (half-radius yields `0.25·MAX_RATE`, not `0.5`).
  - `wrapTime`: forward past `duration` wraps to small positive; backward past `0` wraps to near `duration`; exact boundaries.
  - Lerp step: monotonic approach to target, decay to ~0 when target is 0.
- Behavioral aspects best verified manually in-browser (no runner): suspension during carousel scroll, phase-gate skipping intro cards, rAF idling when cursor is away, the ≤3 video cap, reduced-motion / no-hover / slow-connection inertness.

## Out of Scope

- Moving or auto-advancing the carousel from the magnetic field — the carousel position is unchanged by this feature; only video timelines scrub. Clicking still performs the discrete slide jump.
- Touch / pointer-coarse interaction — the effect is hover-pointer only.
- Any visual rendering of the field itself (no glow, ring, or cursor change). The field is invisible.
- Changes to the existing scroll-driven `useCarouselVideoScrub` baseline behavior beyond reading its `dataset.scrubTime` and yielding ownership during carousel motion.
- Audio (videos are silent scrub targets).
- Configurability/UI for radius, rate, or curve — constants are fixed.

## Further Notes

- Constants: `R = 225px`, `k = 0.12`, `MAX_RATE = 0.08` (fraction of duration/sec), falloff `t²`, seek throttle `1/30s`, seek min-delta `0.03s`, video cap `3`. These are tuning values likely to be adjusted by feel during implementation.
- The hook composes alongside the existing `useCarouselVideoScrub` call in the `FeaturedPatios` index; both are gated on motion/capability flags from `useFeaturedCarousel`.
- Distance metric is cursor→button-center euclidean (chosen over nearest-edge for simplicity; the slight asymmetry is acceptable).
- Exit behavior is coast-and-decay (velocity → 0 via the lerp), not a snap back to baseline; videos freeze where momentum dies and re-sync to baseline naturally on the next carousel scroll.
