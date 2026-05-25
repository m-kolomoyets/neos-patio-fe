## What to build

Extract a pure utility `computeActiveSet(inViewIndices, total, radius, looped)` that returns a `ReadonlySet<number>` of indices: the input indices expanded by `radius` neighbours on each side, with wrap-around when `looped` is true. Adopt it in `useFeaturedCarousel` to replace the inline expansion loop currently producing `slidesInViewWithNeighbors` (radius 2, loop-aware). No change to video-mount behaviour — same set membership, just sourced from the shared utility. The utility lives where it can be imported from both `useFeaturedCarousel` and the upcoming `useCarouselParallax` rewrite without crossing module-scope boundaries (likely co-located under `FeaturedPatios/utils/` since both consumers live in or under `FeaturedPatios`).

## Acceptance criteria

- [ ] `computeActiveSet` exists as a pure function with no DOM or framework dependencies
- [ ] Signature: `(inViewIndices: readonly number[], total: number, radius: number, looped: boolean) => ReadonlySet<number>`
- [ ] Empty input → empty set
- [ ] `total === 0` → empty set
- [ ] Non-loop mode: neighbours that would fall outside `[0, total)` are dropped
- [ ] Loop mode: neighbours wrap via `((target % total) + total) % total`
- [ ] `useFeaturedCarousel` imports and uses `computeActiveSet` for `slidesInViewWithNeighbors`; the existing radius-2 + `EAGER_MOUNT_THRESHOLD` heuristic is preserved
- [ ] Video mount window behaviour is unchanged: visual smoke test on Home page confirms preloading still kicks in for in-view + 2 neighbours
- [ ] `npm run tsc` clean
- [ ] `npm run lint` clean

## Blocked by

None - can start immediately.
