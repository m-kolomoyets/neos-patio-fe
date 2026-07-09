## What to build

Add the four **top-edge** targets — tilted views that frame the top plus one
side.

Extend the type definitions and the orientation table with `edge-top-n`,
`edge-top-e`, `edge-top-s`, `edge-top-w` (pitch 30°, bearings 0/90/180/270).
Wire the mid-edge cells of the top face and the top-mid cell of each side face to
the abutting top edge; the same edge is reachable from the top face and its one
adjacent side face, resolving to one identical target.

The wedge hover and click-snap mechanisms from the grid hit-model slice are
reused as-is. Clicking a top edge snaps to the tilted top+side view and leaves
the cube in live 3D.

## Acceptance criteria

- [ ] `edge-top-n/e/s/w` exist in the type union and the orientation table at pitch 30°, cardinal bearings.
- [ ] Clicking a top-edge cell snaps to a tilted view of the top plus one side.
- [ ] The same top edge is reachable from the top face and its adjacent side face, resolving to one identical target.
- [ ] Hovering any top-edge cell lights the edge as a wedge/strip across the meeting faces.
- [ ] Top-edge clicks leave the cube in live 3D (no flatten).
- [ ] Bearing collision with the cardinal face (both at the same bearing) is distinguished only by pitch and by cell position.

## Blocked by

- Blocked by #01-grid-hit-model-corners-wedge-hover
