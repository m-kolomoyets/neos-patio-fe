# Combined Transform Gizmo (Simultaneous Move / Scale / Rotate)

## Problem Statement

When editing a patio, a user selects a 3D object and manipulates it with a transform gizmo. Today the gizmo shows only **one mode at a time** — Move, Rotate, or Scale — chosen via Toolbar buttons. To position an object the user must constantly switch modes (move it, switch to rotate, switch to scale, switch back). This is slow and breaks flow. The gizmo is also constrained: Move only works on the ground plane (no vertical lift), and Rotate only spins around the vertical (yaw) axis, so objects can't be tilted.

## Solution

The user selects an object once and sees **all transform affordances at the same time**, with no mode switching:

- **Move** — drag along any of the 3 axes (X, Y, Z), including lifting the object vertically.
- **Rotate** — rotate around any of the 3 axes (X, Y, Z), so objects can be tilted in any direction.
- **Scale** — a **single uniform handle** that grows/shrinks the whole model proportionally, regardless of which way it is dragged.

The Move/Rotate/Scale mode buttons disappear from the toolbar. The properties panel gains numeric fields for all three rotation axes. All changes autosave as before.

## User Stories

1. As a patio editor, I want to move, rotate, and scale a selected object without switching tools, so that I can place objects quickly in one continuous flow.
2. As a patio editor, I want to see the move, rotate, and scale handles simultaneously on the selected object, so that I always know every manipulation available to me.
3. As a patio editor, I want to drag an object along the X axis, so that I can position it east/west.
4. As a patio editor, I want to drag an object along the Z axis, so that I can position it north/south.
5. As a patio editor, I want to drag an object along the Y (vertical) axis, so that I can lift it off the ground or set its altitude.
6. As a patio editor, I want to rotate an object around the vertical (yaw) axis, so that I can change which way it faces.
7. As a patio editor, I want to rotate an object around the X axis (pitch), so that I can tilt it forward/backward.
8. As a patio editor, I want to rotate an object around the Z axis (roll), so that I can tilt it side to side.
9. As a patio editor, I want a single scale handle that scales the whole model uniformly, so that I never accidentally distort the model along one axis.
10. As a patio editor, I want the gizmo handles to be visually distinguishable (arrows vs. rings vs. center handle), so that I can tell move, rotate, and scale apart at a glance.
11. As a patio editor, I want map panning/zooming to pause while I drag a gizmo handle, so that my drag doesn't fight the map and re-enable when I let go.
12. As a patio editor, I want to fine-tune position, altitude, rotation (yaw/pitch/roll), and scale via numeric inputs in the properties panel, so that I can set exact values the gizmo can't easily hit.
13. As a patio editor, I want my full rotation (all 3 axes) to be saved, so that when I reload the patio the object keeps the orientation I gave it.
14. As a patio editor, I want every gizmo change to autosave, so that I don't lose work.
15. As a patio editor, I want undo/redo to still work after gizmo edits, so that I can revert mistakes.
16. As a patio editor, I want the selection outline to keep tracking the object as I transform it, so that I always see what is selected.
17. As a patio editor, I want clicking empty map to deselect and clicking another object to select it, so that selection keeps working with the new gizmo.
18. As a returning patio editor, I want previously-saved objects (with only yaw stored) to still load correctly, so that existing patios aren't broken by the new rotation fields.

## Implementation Decisions

### Gizmo composition
- Replace the single mode-switched `TransformControls` with **three `TransformControls` instances mounted simultaneously** on the same target object, each pinned to a fixed mode: one `translate`, one `rotate`, one `scale`.
- Rationale: in the underlying transform-controls implementation, a pointer-down only begins a drag when that instance's own handle is hit; non-hit instances stay idle, so the three coexist without conflict.
- Each instance shares the same drag-commit handler; only the instance that was actually dragging fires its commit, so attaching the same handler to all three is safe.
- Give the instances distinct handle sizes (e.g. rotate rings largest) so the overlapping gizmos remain readable.

### Move
- Enable all 3 axes (X, Y, Z). The previously-disabled vertical (Y) axis becomes active; vertical movement maps to the object's altitude through the existing geo↔scene projection (which already round-trips altitude).

### Rotate
- Enable all 3 axes (X, Y, Z rings).
- Requires persisting full orientation. **Extend the placed-object model** with two new optional rotation fields (pitch around X, roll around Z) alongside the existing yaw (around Y). New fields are optional and default to 0, so existing fixtures/saved data remain valid.
- The object's rotation is applied as an Euler triple (pitch, yaw, roll) and read back from the same components on drag-commit.

### Scale
- Present a **single uniform handle** (the center handle). Because toggling per-axis visibility also hides the uniform center handle, the per-axis scale handles are instead hidden by traversing the gizmo and hiding every scale handle except the uniform center one. As a defensive fallback, uniform scaling is also enforced on object-change (any scale drag is collapsed to a single factor), so even if the visual hide misses, behavior stays uniform.

### Remove the mode concept
- Delete the editor "mode" notion entirely: the `EditorMode` type, the `mode` state, and the `setMode` action.
- Remove the Move/Rotate/Scale buttons from the toolbar; keep Undo/Redo and the autosave status indicator.
- Remove the now-unused `mode` reference from the selection raycaster.

### Camera/projection compatibility
- The map renderer overrides the camera projection matrix, so the gizmo's raycaster is monkey-patched to use the inverse-projection stored on the camera. This patch must be applied to **each** of the three gizmo instances (today it is applied to the single instance).

### Properties panel
- Keep the existing Lng / Lat / Alt / Scale fields and the Yaw field.
- Add **Pitch (°)** and **Roll (°)** numeric fields using the same degree↔radian conversion pattern, editing the two new rotation fields.

### Persistence / API
- The mock service stores the full objects array as-is, so the new rotation fields persist with no API contract change beyond the extended object shape. Autosave (debounced) and undo/redo are unchanged.

## Testing Decisions

This repository has **no test runner configured** and CLAUDE.md explicitly instructs not to add one unless asked. Therefore no automated tests are written for this change. Verification is **manual / build-time**:

- Type-check passes (`npm run tsc`).
- Lint passes (`npm run lint` — eslint, stylelint, prettier).
- Manual end-to-end check in the dev server (`npm run dev`):
  - Selecting an object shows all three gizmos at once (3 move arrows, 3 rotate rings, 1 center scale handle).
  - Each move axis works, including vertical lift updating altitude.
  - Each rotate ring (X/Y/Z) tilts the object; yaw/pitch/roll values update in the properties panel.
  - The single scale handle scales uniformly with no per-axis distortion.
  - Map pan/zoom is suppressed during a drag and restored after.
  - Selection outline tracks the object; click-to-select/deselect still works.
  - Edits autosave (status indicator) and survive reload, including all 3 rotation axes.
  - Undo/redo works after gizmo edits.
  - A patio whose saved objects predate the new fields (yaw only) still loads with pitch/roll defaulting to 0.

If, in a later iteration, the team wants automated coverage, the natural deep, isolated unit to test is the **geo↔scene projection** (pure functions converting longitude/latitude/altitude to/from scene coordinates), since it has a simple, stable interface and is the riskiest math in the round-trip — but writing it is out of scope here per repo convention.

## Out of Scope

- Non-uniform (per-axis) scaling — explicitly replaced by a single uniform scale handle.
- Snapping / grid increments for translate, rotate, or scale.
- Multi-object selection or group transforms.
- Keyboard shortcuts for transforms.
- Any change to the autosave, undo/redo, selection-raycasting, or map-rendering architecture beyond what's needed to drop the mode concept and patch all three gizmo instances.
- Backend/API changes beyond the extended placed-object shape (backend is mock fixtures).
- Adding a test runner or automated tests.

## Further Notes

- The gizmo handle internals are private API of the transform-controls implementation; the scale-handle hiding is implemented defensively (guard for missing nodes, re-apply on selection change and on the controls' change event) and backed by the uniform-scale enforcement fallback.
- Three overlapping gizmos can look visually busy; distinct handle sizes per instance mitigate this. If clutter is still a concern after review, a follow-up could introduce subtle per-mode coloring/opacity.
- Care should be taken that the three instances don't each independently toggle map interaction in a conflicting way; a single shared "is dragging" gate can be used if needed.
