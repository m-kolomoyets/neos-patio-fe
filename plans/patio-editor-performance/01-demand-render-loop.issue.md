## What to build

Switch the `react-three-map` `<Canvas>` in the Patio Editor map to `frameloop="demand"`.

Currently no `frameloop` prop is passed, so the library calls `map.triggerRepaint()` after every render — an infinite max-FPS repaint loop that runs forever, even when the editor is idle and nothing is moving. This is the single largest source of thermal load (M1 Pro hitting ~100°C at idle).

The scene is static / interaction-only (no autonomous animation), so demand-based rendering is safe. In demand mode the library wires R3F `invalidate()` to `map.triggerRepaint()`, so the scene redraws on map movement and explicit invalidation only.

## Acceptance criteria

- [ ] `<Canvas>` receives `frameloop="demand"`.
- [ ] At idle (editor open, no interaction), browser/Activity Monitor shows near-zero busy frames — no continuous repaint loop, no fan spin.
- [ ] Pan / zoom / orbit still redraw the 3D scene correctly while interacting.
- [ ] Placing an object renders it immediately.
- [ ] Dragging an object via the transform gizmo redraws the scene live (drei TransformControls already calls `invalidate()`).
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
