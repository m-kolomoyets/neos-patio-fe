## What to build

Add orientation controls to the bottom row of the `MapControls` bar: the rotate **← / →** group and the compass button, driven by a shared live bearing.

- New `useMapBearing()` hook: subscribes to the map's `rotate`/`render` events (effect + cleanup, same pattern as `useZoomAtLeast`) and exposes the current bearing as state.
- Rotate arrows: relative quarter-turn — `map.easeTo({ bearing: currentBearing ∓ 90 })`, wrapped mod 360. Left decrements, right increments.
- Compass: `compass_24.svg` needle rotated by `-bearing` (live), always visible even at bearing 0. Click → `map.resetNorth()` (animated reset to north-up).
- Rotate arrows and compass share the same `useMapBearing()` value, so the displayed orientation is always consistent.
- Reduced-motion gating: all camera moves here (rotate, resetNorth) use `duration: 0` when `prefersReducedMotion()` is true, eased otherwise.
- Rotate arrow icons reuse `redo_24.svg` / `undo_24.svg`.

## Acceptance criteria

- [ ] Rotate → rotates the map 90° clockwise per tap; rotate ← 90° counter-clockwise; angle wraps correctly across 0/360.
- [ ] Works from any starting bearing (including non-multiples of 90 from free drag-rotate).
- [ ] Compass needle continuously points to true north as the map rotates (drag or button).
- [ ] Tapping the compass animates the map back to north-up (bearing 0).
- [ ] With reduced-motion enabled, rotate and reset are instant (no animation).
- [ ] Rotate buttons and compass never show inconsistent orientation.
- [ ] `pnpm tsc` and `pnpm lint` pass.

## Blocked by

- Blocked by #01-bar-scaffold-zoom (needs `MapControls` bar + `useCreatePatioMap()`).
