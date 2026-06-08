## What to build

The tracer-bullet slice that stands up the entire custom-gizmo architecture end-to-end through **translate mode**. A new framework-agnostic gizmo unit builds the gizmo from real 3D mesh Cesium primitives (cylinders for shafts, cones for arrowheads), oriented in the world ENU frame at the selected object's origin, drawn always-on-top, and rescaled every frame so it keeps a constant on-screen size at any zoom. Handles carry typed pick ids and are grabbed via `scene.pick`. A thin React hook (replacing the vendored-gizmo hook) manages lifecycle: attach to the selected, loaded model in the current mode; tear down on deselect; recreate on selection/mode/ready changes.

Translate works fully: dragging an X/Y/Z arrow mutates the live model's `modelMatrix` (closest point between mouse ray and the world axis line) with smooth per-step renders; the Cesium camera controller is disabled during the drag and the selection click is suppressed; on release the matrix is decomposed and a single `transform` action is dispatched (one undo entry). The dragged axis is tracked so a horizontal (east/north) drag re-grounds to the sampled surface and clamps to bounds, while a vertical (up) drag keeps the manually set height. The existing selection handler is updated to ignore the gizmo's new handle pick ids.

Rotate and scale modes may show no handles yet (added in later slices); the vendored gizmo remains until slice #4.

## Acceptance criteria

- [ ] Selecting a loaded object shows the translate gizmo (3 colored axis arrows); deselecting removes it
- [ ] Gizmo stays constant on-screen size while zooming in/out (per-frame pre-render rescale)
- [ ] Gizmo renders on top of the model (depth test off); handles grabbable even when behind the mesh
- [ ] `scene.pick` reliably identifies the grabbed handle via its typed `{axis, handle}` pick id
- [ ] Axes point along world ENU (east/north/up), independent of object heading
- [ ] Dragging each axis moves the model live and smoothly (render requested each step)
- [ ] Camera pan/zoom is disabled during a drag and restored on release
- [ ] Clicking a gizmo handle does not change the current selection
- [ ] Clicking empty ground deselects; clicking another object selects it
- [ ] Horizontal drag re-grounds to the sampled surface height and clamps to bounds
- [ ] Vertical (up) drag keeps the manually set height (no reground)
- [ ] Each drag commits exactly one `transform` action / one undo entry
- [ ] Selection outline keeps tracking the object during and after a transform
- [ ] Drag math lives in pure, independently-reasoned functions (ray-to-axis closest point)
- [ ] `npm run tsc` and `npm run lint` pass; no `any`/untyped gizmo surface

## Blocked by

- None - can start immediately
