## What to build

Remove the retired radial-magnetic code now that the half-split model has replaced it. The video frame scrub is retired for good and the radial dual-center field util is no longer referenced.

End-to-end:

- Delete `useCarouselMagneticScrub.ts`.
- Delete `computeMagneticTarget.ts`.
- Remove the commented-out scrub import and hook call in `FeaturedPatios/index.tsx`.

## Acceptance criteria

- [ ] `useCarouselMagneticScrub.ts` deleted.
- [ ] `computeMagneticTarget.ts` deleted.
- [ ] No remaining imports or references to either file anywhere in the codebase.
- [ ] Commented scrub import/call removed from `FeaturedPatios/index.tsx`.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #plans/featured-carousel-half-magnetic-scroll/half-split-scroll-model.issue.md
