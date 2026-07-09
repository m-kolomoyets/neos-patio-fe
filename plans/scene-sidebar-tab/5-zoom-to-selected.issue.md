## What to build

Add the **Zoom to Selected** action to the row menu, flying the camera to frame the object.
Implement a small PatioEditor-scoped helper that derives the object's world position from its
`lng`/`lat`/`height` and flies the camera to a bounding sphere centered there, with a range
scaled from the object's `scale` (geo-only — it does not read live glTF bounds). The helper is
its own function rather than an import of the ViewCube-folder camera hook (which is folder-scoped
and must not be imported from outside). Add the menu item (target icon) above Delete Object,
acting on the row's object.

Verifiable: object scrolled off-screen → row menu → Zoom to Selected → camera flies and frames it.

## Acceptance criteria

- [ ] "Zoom to Selected" (target icon) appears in the row menu above Delete.
- [ ] Choosing it flies the camera to center and frame that object.
- [ ] Framing range scales with the object's `scale` so small and large objects are both usable.
- [ ] Fly logic is a standalone PatioEditor-scoped helper, not an import of the ViewCube camera hook.
- [ ] Type-check and lint pass.

## Blocked by

- Blocked by #4-row-menu-and-delete (extends the same row menu)
