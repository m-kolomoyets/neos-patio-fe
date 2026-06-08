## What to build

Restore translate / rotate / scale of a selected object via the vendored `cesium-gizmo`, with each
completed drag forming one undo step and dragged objects staying grounded and in-bounds.

End-to-end:
- Vendor `zhwy/cesium-gizmo` (Apache-2.0, not on npm) into the editor module: copy its `src/` files
  and add a hand-written TypeScript declaration (constructor, `Mode` enum, options, `onDragMoving` /
  drag-end callback types).
- A gizmo adapter attaches the gizmo to the selected `Model.fromGltfAsync` item (it operates on the
  item's `modelMatrix`), with modes translate / rotate / scale (+ uniform scale).
- Live drag mutates the model for smooth feedback; on **drag-end**, read the callback result
  (`Cartesian3` / `HeadingPitchRoll` / scale array), write it into `EditorContext` geographic + HPR
  state, and push exactly one history entry.
- On translate drag-end, re-clamp height via `sampleHeightMostDetailed` and clamp `lng`/`lat` to the
  patio bounds.
- Undo / redo restores prior transforms. Gizmo drag fires `scene.requestRender()`.

## Acceptance criteria

- [ ] `cesium-gizmo` source vendored into the editor module with a hand-written `.d.ts`
- [ ] Selecting an object attaches the gizmo; deselecting removes it
- [ ] Translate, rotate, and scale (including uniform scale) all work on the selected model
- [ ] Each completed drag commits exactly one undo step
- [ ] Undo and redo restore the previous transform state
- [ ] Translate drag keeps the object on the surface and within bounds
- [ ] Gizmo drag triggers renders under `requestRenderMode`
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #plans/cesium-map-migration/s3-selection-highlight.issue.md
