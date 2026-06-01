## What to build

The foundational tracer bullet that moves object placement from geographic (`lng`/`lat`/`alt`/`yawRad`) to a local Cartesian frame in meters, anchored at the patio bounds center, and enables full 3-axis translation.

End-to-end: a placed object is stored as `{ id, modelId, x, y, z, rotX, rotY, rotZ, scale }`, rendered directly from those values, and can be dragged on all three translate axes (east/up/south) with the new values written straight back from the gizmo — no scene↔geo conversion. Horizontal movement stays clamped to the patio footprint; vertical (y) is free. Newly added objects appear at the current view center.

The Properties panel is updated only as far as needed to compile and remain usable (flat X/Y/Z position, a single rotation field, scale). Full panel grouping and rotation/dimension polish come in later slices.

## Acceptance criteria

- [ ] `PlacedObject` is `{ id, modelId, x, y, z, rotX, rotY, rotZ, scale }`; `lng`/`lat`/`alt`/`yawRad` removed; fixtures/mock compile against the new shape.
- [ ] Objects render with `position={[x,y,z]}` and `rotation={[rotX,rotY,rotZ]}`; the per-render `geoToScene` projection is gone.
- [ ] Translate gizmo exposes all three axes (X, Y, Z); dragging up/down moves the object vertically.
- [ ] Drag end writes raw `position` (and scale) from the gizmo target into the store — no `sceneToGeo`.
- [ ] `transform` clamps x and z to the scene-space bounds; y is never clamped.
- [ ] `add` projects the current map center into scene x/z with y=0, then clamps x/z; the new object is selected.
- [ ] `boundsClamp` operates in scene space (min/max x/z derived once from bounds corners via `geoToScene`).
- [ ] `sceneToGeo` is deleted; `geoToScene` is retained and used only for the clamp range and add-time projection.
- [ ] Uniform-scale enforcement during scale drags is preserved.
- [ ] Undo/redo, selection, autosave still work with the new object shape.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
