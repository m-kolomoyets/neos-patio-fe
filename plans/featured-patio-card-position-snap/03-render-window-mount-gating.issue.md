## What to build

Gate video mounting on a render window of visible cards plus one neighbor on each side. Parent extends its existing `intersectingIds` → `prefetchIds` derivation into a single render-window Set (visible ± 1 neighbor by index). Parent passes `shouldMountVideo` prop to each card; the existing `shouldPrefetch` collapses into this same signal. Cards outside the window unmount `<video>` and show `img-high` only. Cards inside the window mount, fetch the blob, seek to the current snap value on metadata ready, and become visible.

## Acceptance criteria

- [ ] Parent computes a render-window Set: visible card IDs from IntersectionObserver plus index neighbors at ±1.
- [ ] Edge cards have one neighbor (or zero at ends); no out-of-bounds index access.
- [ ] `FeaturedPatioCard` receives a single `shouldMountVideo` prop; legacy `shouldPrefetch` removed or routed through the same signal.
- [ ] When a card leaves the render window, its `<video>` unmounts; image high remains visible without a flash.
- [ ] When a card re-enters the render window, video re-mounts, blob fetch runs (or HTTP cache serves), and on metadata ready the video seeks to current snap before becoming visible.
- [ ] Fast-scrolling through the carousel never leaves more than (visible + 2) video elements mounted at once.
- [ ] Broken video URL still routes to image fallback and does not affect neighbors.
- [ ] Type-check and lint pass.

## Blocked by

- Blocked by `01-snap-engine.issue.md`
