## What to build

Add the four **vertical-edge** targets — corner-on views that frame the two
adjacent side faces.

Extend the type definitions and the orientation table with `edge-ne`, `edge-se`,
`edge-sw`, `edge-nw` (pitch 60°, bearings 45/135/225/315). Wire the left- and
right-mid cells of each side face to the abutting vertical edge; the same edge is
reachable from both flanking side faces and resolves to one identical target.

The wedge hover and click-snap mechanisms from the grid hit-model slice are
reused as-is — these are additive cells plus table entries, no new mechanism.
Clicking a vertical edge snaps corner-on and leaves the cube in live 3D.

## Acceptance criteria

- [ ] `edge-ne/se/sw/nw` exist in the type union and the orientation table at pitch 60°, diagonal bearings.
- [ ] Clicking a vertical-edge cell snaps to a corner-on view of the two adjacent sides.
- [ ] The same vertical edge is reachable from both flanking side faces, resolving to one identical target.
- [ ] Hovering any vertical-edge cell lights the edge as a wedge/strip across both faces.
- [ ] Vertical-edge clicks leave the cube in live 3D (no flatten).
- [ ] Cell → target mapping covers the new mid-side cells purely.

## Blocked by

- Blocked by #01-grid-hit-model-corners-wedge-hover
