## What to build

Add **rotate mode** to the custom gizmo built in slice #1. When the editor mode is rotate, the gizmo shows three rotation rings (torus primitives) about the world ENU axes — heading (up), pitch (east), roll (north) — using the same always-on-top, screen-constant, `scene.pick` infrastructure. Dragging a ring applies a rotation delta about that world axis directly to the model's `modelMatrix` for smooth live feedback; on release the matrix is decomposed back into a heading/pitch/roll patch via the existing matrix→geo-pose conversion and committed as a single `transform` action (one undo entry). Camera inputs and selection suppression reuse the slice-#1 drag lifecycle.

## Acceptance criteria

- [ ] Switching to rotate mode shows three rings (H/P/R) about the world ENU axes; other modes' handles are not shown
- [ ] Each ring is reliably pickable via `scene.pick` and carries a typed pick id
- [ ] Dragging a ring rotates the model live and smoothly about that world axis
- [ ] On release, orientation round-trips into heading/pitch/roll via the existing decompose path
- [ ] Each rotate drag commits exactly one `transform` action / one undo entry
- [ ] Camera disabled during drag and restored after; selection unchanged by grabbing a ring
- [ ] Rotation-delta-about-axis math is a pure, independently-reasoned function
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #01-gizmo-core-translate
