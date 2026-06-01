# Ground-snapping placement

## What to build

Make placed models snap to the real ground height. When a user drops a new model or moves an existing one, the model's altitude is set to the terrain elevation at its location, so it sits correctly on slopes and flat ground instead of floating or sinking at sea level.

End-to-end behavior: dropping a model lands it on the ground at the drop point; translating it up a hill or into a valley re-settles it onto the ground at the new location on mouse-up. Auto-snap after placement does not create a phantom undo step — pressing undo right after placing simply removes the model. If elevation data hasn't loaded yet, placement still succeeds (lands at sea level, then corrects once tiles decode).

Type: **AFK**.

## Acceptance criteria

- [ ] `useGroundSnap()` hook returns `(lng, lat) => Promise<number>`; queries `map.queryTerrainElevation`, retries on map `idle` until a non-null value (cap ~10), falls back to `0`.
- [ ] History-free `groundSnap` reducer action (`{ id, alt }`) updates only `alt` without pushing to the undo stack.
- [ ] `ObjectMesh` snaps once on mount (placement) via the `groundSnap` action.
- [ ] `ObjectMesh` snaps on transform `onMouseUp` (move), overriding altitude before dispatching the existing `transform` action.
- [ ] Reducer/state layer stays map-agnostic (no MapLibre access in the reducer).
- [ ] Models sit on the ground on both slope and flat ground; remain aligned while panning/tilting.
- [ ] Undo immediately after placing removes the object cleanly with no extra auto-snap undo step.
- [ ] Placement before DEM tiles load lands at sea level then corrects; no repeating `queryTerrainElevation null` loop in console.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #02-terrain-relief (terrain must be enabled to query elevation).
