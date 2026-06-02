## What to build

P2 / optional polish of remaining per-frame and re-registration costs.

1. **ViewCube isolation.** `useMapCamera` calls `setCamera` on every map `move`, re-rendering the whole ViewCube subtree per frame during interaction. Isolate the live camera transform into a small leaf component (or push via ref / CSS variable) so the parent and controls do not re-render per frame, and wrap `ZoomControl` in `React.memo`.

2. **SelectionRaycaster cleanup.** Drop the unused `mode` dependency that re-registers the map `click` handler on every mode switch. Optionally raycast only the placed-object group instead of the entire `scene.children` (recursive).

## Acceptance criteria

- [ ] ViewCube still reflects live camera orientation, zoom %, home, and fit while interacting.
- [ ] ViewCube subtree no longer fully re-renders every map frame (verify with profiler); `ZoomControl` is memoized.
- [ ] Selection click handler is not re-registered on mode change.
- [ ] Object selection by click still works in all modes.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
