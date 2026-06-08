## What to build

Restore click selection and the selected-object highlight using native Cesium. Clicking a placed
object selects it and shows an outline; clicking empty ground deselects.

End-to-end:
- Each placed model is tagged with an `editorObjectId` so picking can distinguish placed models from
  the Google tileset.
- A `selection` handler uses `scene.pick` on left click: if the picked primitive carries an
  `editorObjectId`, dispatch `select`; otherwise deselect.
- Highlight: set `silhouetteColor` / `silhouetteSize` on the selected model, cleared on deselect.
- The old Three.js `SelectionRaycaster` and `SelectionOutline` (OutlinePass/EffectComposer) are
  deleted.
- Selection changes fire `scene.requestRender()`.

## Acceptance criteria

- [ ] Each placed model is tagged with an `editorObjectId`
- [ ] Clicking a placed object selects it (`scene.pick` resolves the tagged primitive)
- [ ] Clicking empty ground / the world tileset deselects
- [ ] Selected object shows a per-model silhouette outline; deselect clears it
- [ ] `SelectionRaycaster` and `SelectionOutline` are removed
- [ ] Selection change triggers a render under `requestRenderMode`
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #plans/cesium-map-migration/s2-place-objects-on-ground.issue.md
