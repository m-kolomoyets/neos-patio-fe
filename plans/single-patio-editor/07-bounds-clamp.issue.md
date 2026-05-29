## What to build

Create the `BoundsClamp` pure utility: given patio bounds (bbox) and a candidate `{ lng, lat }`, returns the nearest in-bounds point (clamps to the closest edge if outside, identity if inside). Apply it in the reducer on `add` and `transform` so neither action can land an object outside bounds. Camera bounds are already hard-clamped by MapLibre `setMaxBounds` from slice 2 — no change there.

## Acceptance criteria

- [ ] `src/modules/PatioEditor/utils/boundsClamp.ts` exports a pure `clampToBounds(bounds, lngLat)` function
- [ ] Returns identity when input is inside bounds
- [ ] Snaps to nearest edge when outside (corner cases included)
- [ ] Reducer `add` action clamps the drop point
- [ ] Reducer `transform` action clamps `{ lng, lat }` before commit
- [ ] Dragging an object's translate gizmo past a bound visibly snaps to the edge
- [ ] `npm run tsc` and `npm run lint` clean

## Blocked by

- Blocked by `06-selection-and-gizmo.issue.md`
