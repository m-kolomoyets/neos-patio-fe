## What to build

Change the card hover-leave rewind so that the video eases back to the live position-snap frame instead of frame 0. The rewind tick reads the latest snap value from a ref kept current by the parent's `setSnap` callback, so concurrent scrolling during the 500ms rewind keeps the target up to date. Easing curve (`easeOutCubic`) and duration (`TRANSITION_DURATION_MS = 500`) are unchanged. Y-shift rewind logic is unchanged.

## Acceptance criteria

- [ ] On `pointerleave`, video eases from current `currentTime` to the live snap value over 500ms with `easeOutCubic`.
- [ ] If the user scrolls during rewind, the rewind target updates per frame to match the new snap value (no snap-back to a stale target).
- [ ] After rewind completes, phase returns to `idle` and scroll-snap resumes ownership of `currentTime`.
- [ ] Y-shift rewind unchanged.
- [ ] Hovering, scrubbing, then leaving without any scroll lands the video back at the static snap frame for that card's current viewport position.
- [ ] Type-check and lint pass.

## Blocked by

- Blocked by `01-snap-engine.issue.md`
