## What to build

Full 3-axis rotation for placed objects. The rotate gizmo, previously yaw-only, now exposes all three rotation axes, and the new values round-trip raw through the store. The Properties panel gains editable rotation fields for all three axes in degrees.

End-to-end: select an object, switch to rotate mode, and rotate it around X (pitch), Y (yaw), and Z (roll); the orientation persists, autosaves, and is reflected in the panel. Typing a degree value in any rotation field updates the object and the gizmo.

## Acceptance criteria

- [ ] Rotate-mode gizmo shows all three axes; the per-mode axis-visibility table (yaw-only) is removed.
- [ ] Dragging the rotate gizmo writes `rotX`, `rotY`, `rotZ` raw from `target.rotation` on drag end.
- [ ] Panel has three rotation fields (X/Y/Z) in degrees, converting to/from stored radians, step 1.
- [ ] Editing a rotation field updates the object and the on-screen gizmo/orientation.
- [ ] Pitch and roll persist through autosave and undo/redo.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-cartesian-model-and-3-axis-translate
