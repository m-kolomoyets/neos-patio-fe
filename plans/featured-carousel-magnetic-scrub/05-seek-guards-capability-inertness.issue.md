## What to build

Bound the per-frame seek/decode cost and confirm the effect is fully inert where it should not run. Reuse the guard pattern from `useCarouselVideoScrub` per video: skip if `video.seeking`, throttle seeks to ~1/30s, require a min delta of `0.03s`, and integrate `v · duration · dt` into a per-video float accumulator that only commits to `currentTime` when guards pass (keeping the remainder so velocity stays continuous). Verify capability inertness: no-hover pointer, slow connection, and reduced-motion all keep the hook off via `videoCapable`.

## Acceptance criteria

- [ ] Writes to `currentTime` are skipped while `video.seeking`
- [ ] Seeks are throttled to ~1/30s per video and require ≥0.03s delta
- [ ] Velocity integrates continuously via a float accumulator while actual seeks stay throttled (smooth despite throttling)
- [ ] Effect is fully off on touch / no-hover pointer
- [ ] Effect is fully off on slow connection and under prefers-reduced-motion
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #plans/featured-carousel-magnetic-scrub/03-all-in-view-videos-cap-phase-gate.issue.md
