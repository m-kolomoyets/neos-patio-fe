## What to build

Add **scale mode** to the custom gizmo built in slice #1. When the editor mode is scale, the gizmo shows three colored axis cubes (box primitives) on the world ENU axis ends, matching the reference look, using the same always-on-top, screen-constant, `scene.pick` infrastructure. Dragging any cube changes the object's single uniform `scale` field by the ratio of the cursor's current distance from the origin to its start distance — all three cubes behave uniformly (no per-axis scale, no data-model change). The model updates live during the drag; on release a single `transform` action with the new uniform scale is committed (one undo entry). Camera inputs and selection suppression reuse the slice-#1 drag lifecycle.

## Acceptance criteria

- [ ] Switching to scale mode shows three colored axis cubes; other modes' handles are not shown
- [ ] Each cube is reliably pickable via `scene.pick` and carries a typed pick id
- [ ] Dragging any cube scales the whole model uniformly, live and smoothly (no per-axis distortion)
- [ ] Scale factor = current-distance-from-origin / start-distance, applied to the single `scale` field
- [ ] Each scale drag commits exactly one `transform` action / one undo entry
- [ ] Camera disabled during drag and restored after; selection unchanged by grabbing a cube
- [ ] Scale-ratio math is a pure, independently-reasoned function
- [ ] `PlacedObject` schema and geo↔matrix conversions remain unchanged
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #01-gizmo-core-translate
