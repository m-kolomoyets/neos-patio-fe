## What to build

Extend the magnetic scrub from the single centered video to **all videos currently in view**, so the whole visible carousel reacts together. Drive the apply step from `emblaApi.slidesInView()`, hard-capped at 3 simultaneously-scrubbing videos. Skip any slide whose card has `data-phase !== 'idle'` so cards still playing their intro animation are left untouched.

## Acceptance criteria

- [ ] All in-view videos scrub together with the same proximity-driven velocity
- [ ] No more than 3 videos scrub simultaneously (safety cap)
- [ ] A card with `data-phase !== 'idle'` is skipped and continues its intro uninterrupted
- [ ] Per-video velocity uses that video's own `duration` so visual travel is consistent across differing clip lengths
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #plans/featured-carousel-magnetic-scrub/02-tracer-single-video-magnetic-scrub.issue.md
