## What to build

Implement selection and the gizmo. Add `select` / `setMode` / `transform` actions to the reducer. `ObjectMesh` click dispatches `select(id)`. Empty-map click (MapLibre `click` event with no mesh hit) dispatches `select(null)`. Build a `Gizmo` component that binds drei `<TransformControls>` to the selected mesh ref, reading `mode` from context. Add a `Toolbar` component with a mode switcher (translate / rotate / scale). Constrain modes: translate locks Z (ground plane), rotate locks to Y axis (yaw only), scale is uniform. On gizmo `objectChange`, read the mesh transform, invert through `GeoSceneProjection` to `{ lng, lat, alt, yawRad, scale }`, and dispatch `transform`. While the gizmo is being dragged, disable MapLibre interactions (`map.dragPan.disable()` etc.) and re-enable on release.

## Acceptance criteria

- [ ] Reducer handles `select`, `setMode`, `transform`
- [ ] Clicking a mesh selects it; clicking empty map deselects
- [ ] Selected mesh shows drei `<TransformControls>` matching current `mode`
- [ ] `Toolbar` mode switcher cycles translate / rotate / scale and the gizmo reflects it
- [ ] Translate constrained to XY (ground plane)
- [ ] Rotate constrained to Y axis (yaw)
- [ ] Scale is uniform
- [ ] During gizmo drag, MapLibre pan/zoom/rotate/pitch are disabled; re-enabled on release
- [ ] Transform dispatch round-trips through `GeoSceneProjection`; object stays in correct geo position after release
- [ ] `npm run tsc` and `npm run lint` clean

## Blocked by

- Blocked by `05-editor-context-and-add-from-catalog.issue.md`
