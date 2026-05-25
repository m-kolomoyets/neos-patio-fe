## What to build

Prevent the magnetic scrub from fighting the existing scroll-driven `useCarouselVideoScrub` when the carousel actually animates (e.g. after a nav-button click). Track an `isScrolling` flag from embla events (`pointerDown`/`scroll` → `settle`). While the carousel is in motion, the magnetic hook suspends and yields `currentTime` ownership to the scroll scrub; it resumes on `settle`.

## Acceptance criteria

- [ ] Magnetic scrub suspends between carousel motion start and `settle`
- [ ] Scroll-driven scrub controls `currentTime` cleanly during slide transitions (no jitter/fight)
- [ ] Magnetic scrub resumes after `settle` if cursor is still in a field
- [ ] No double-writes to `currentTime` from both hooks within the same frame during motion
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #plans/featured-carousel-magnetic-scrub/02-tracer-single-video-magnetic-scrub.issue.md
