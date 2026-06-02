## What to build

Replace the permanent `requestAnimationFrame` loop that updates the selection outline (BoxHelper) with an event-driven update.

Today, while an object is selected, a `requestAnimationFrame` loop calls `helper.update()` every frame forever — keeping CPU/GPU awake at idle even when nothing moves.

Replace with: update the helper once on mount, then subscribe to the TransformControls `objectChange` event and call `helper.update()` plus R3F `invalidate()` on change. In demand frameloop mode the `invalidate()` is what redraws the scene, so the outline must invalidate explicitly.

## Acceptance criteria

- [ ] No `requestAnimationFrame` loop remains for the BoxHelper.
- [ ] Selection outline appears on select and is removed/disposed on deselect (no leak).
- [ ] Outline tracks the object accurately while dragging/rotating/scaling via the gizmo.
- [ ] With a selection active and no interaction, idle stays near-zero busy frames.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-demand-render-loop (the outline must `invalidate()` to redraw — only meaningful once frameloop is demand).
