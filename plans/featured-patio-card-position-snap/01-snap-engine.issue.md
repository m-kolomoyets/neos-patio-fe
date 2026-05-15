## What to build

Replace per-card x-translate parallax with position-driven video frame snap. Parent carousel hook computes a normalized position `n ∈ [-1, 1]` per card per scroll rAF and a snap value `s = (n + 1) / 2`, then dispatches `s` to each card via a registration callback (`registerCard(cardId, setSnap)` / `unregisterCard(cardId)`). Card hook accepts the snap stream, stores latest value on a ref, and when phase is `idle` and metadata is ready, sets `video.currentTime = s × duration` (guarded by `!video.seeking`). Video layer becomes visible on `onLoadedMetadata` after an initial seek to the current snap value — no longer hover-only. `--tx` removed from card stack transform and from parent's writes. `MAX_X_PX` constant removed.

Hover scrub, hover Y-shift, and the existing hover-leave rewind-to-0 behavior remain untouched in this slice (rewind target update is the next slice). Render-window mount gating and capability-gate hoist are out of scope here — keep existing mount logic (hover or `shouldPrefetch`).

## Acceptance criteria

- [ ] `--tx` no longer written by `useCarouselParallax`; `.stack` transform drops the `--tx` term.
- [ ] Parent hook computes `s = (n + 1) / 2` per card per scroll rAF and only dispatches when the value changes for that card.
- [ ] Card hook exposes a registration API consumed by the card; unregisters on unmount.
- [ ] When phase is `idle` and video metadata is ready, `video.currentTime` tracks `s × duration` on each scroll rAF; writes are skipped while `video.seeking` is true.
- [ ] `onLoadedMetadata` seeks to current snap value before video becomes visible.
- [ ] `.video[data-active]` is set whenever metadata is ready (not gated on hover phase).
- [ ] Scrolling slowly across the carousel visibly advances each video's frame monotonically with its center position; centered card sits near middle frame.
- [ ] Existing hover scrub and Y-shift still work; hover leave still rewinds to 0 (temp, fixed in next slice).
- [ ] No console errors on broken video URL — broken phase still routes to image.
- [ ] Type-check and lint pass.

## Blocked by

None - can start immediately.
