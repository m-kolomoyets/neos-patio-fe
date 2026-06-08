## What to build

Restore the PropertiesPanel against the new geographic + HPR object format. The panel edits a
selected object's height, heading, pitch, roll, and scale as numeric inputs, and shows its
longitude / latitude read-only (position is changed via the gizmo, not typed).

End-to-end:
- Panel reads the selected object's `{ height, heading, pitch, roll, scale }` and renders editable
  numeric inputs (degrees for HPR, meters for height; per-axis + uniform scale as applicable).
- `lng` / `lat` shown read-only.
- Editing a field dispatches an `EditorContext` transform update; the model and its `modelMatrix`
  update live and the change fires `scene.requestRender()`.
- Edits integrate with undo/redo consistently with gizmo drag-end (one history entry per committed
  edit).

## Acceptance criteria

- [ ] Panel shows editable height, heading, pitch, roll, scale for the selected object
- [ ] `lng` / `lat` are displayed read-only
- [ ] Editing a numeric field updates the model live and re-renders
- [ ] Panel reflects gizmo-driven changes (values stay in sync after a drag)
- [ ] Panel edits participate in undo/redo
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #plans/cesium-map-migration/s3-selection-highlight.issue.md
