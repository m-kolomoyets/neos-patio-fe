## What to build

The flattened "selected face" state from the Figma design. When the user clicks a **side face**, the camera snaps (per #3) and the cube flattens to show that face head-on with helper arrows; clicking a **corner** snaps but stays a 3D cube (no single face is head-on).

Helper arrows in the flattened state:
- **Left / Right** → step bearing ±90° to the adjacent side (re-snap, stay flattened).
- **Up** → jump to the top view.
- The Figma **roll / corner arrows are omitted** — maplibre has no camera roll.

Exit: any drag-orbit, or the camera moving away from the snapped bearing/pitch beyond a threshold, returns to the live 3D cube. No explicit close affordance.

The flattened face is a stylized abstraction — drawn flat regardless of the real ~85° camera pitch; it is not a pixel-accurate mirror of the camera in that mode.

## Acceptance criteria

- [ ] Clicking a side face enters flattened mode (head-on face + helper arrows); clicking a corner stays a 3D cube.
- [ ] Left/Right arrows step bearing ±90° to the neighboring side and stay flattened.
- [ ] Up arrow jumps to the top view.
- [ ] No roll/corner arrows are rendered.
- [ ] Drag-orbit or moving the camera away from the snapped angle (beyond a threshold) exits back to the live 3D cube.
- [ ] Adjacent-face stepping logic is a pure helper in `utils/` (would be unit-testable).
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #03-click-to-snap-and-drag-orbit
