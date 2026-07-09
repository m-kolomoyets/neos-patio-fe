## What to build

The infrastructure tracer for clickable cube zones, delivered end-to-end via
**corners (true isometric 3/4 views)**.

Rebuild each cube face from a single flat div into an invisible 3×3 grid of
hit-zones (the Autodesk hit model): the face wrapper keeps its 3D transform, the
nine cells inside carry the clickable target identity. Wire the corner cells and
the face/center cells; the bottom row of each side face falls back to the face
itself (no dead zones). Repurpose the four corner targets to true top-vertex
isometric framing (pitch 35°, bearings 45/135/225/315) in the single
orientation table.

Replace the pure-CSS `:hover` face highlight with a `hoveredTarget` component
state so all cells sharing one target identity light up together — a corner
reads as a wedge across the faces that meet there. Only the five center cells
keep their letters (N/E/S/W/T); corner cells are unlabeled.

Clicking a corner snaps the camera to its iso view through the existing snap
resolver and keeps the cube in live 3D (no flatten). Drag-to-orbit, click-vs-drag
threshold, zoom, home, and live camera mirroring stay untouched.

Extract the cell-position → target mapping as a pure function (face identity +
cell → target) kept separate from rendering.

## Acceptance criteria

- [ ] Each face renders as an invisible 3×3 grid; grid lines show only on hover.
- [ ] Clicking a corner cell snaps to an iso 3/4 view (top + two sides), pitch 35°, correct diagonal bearing.
- [ ] The same corner is reachable from the top face and from each adjacent side face, resolving to one identical target.
- [ ] Hovering any cell of a corner lights all its cells as a wedge; hover clears on pointer-leave.
- [ ] Hovering/clicking a face center behaves as before (head-on snap, letter visible, flatten + step arrows intact).
- [ ] Clicking the bottom row of a side face snaps to that face (no dead zone).
- [ ] Corner clicks leave the cube in live 3D (no flatten).
- [ ] Drag-to-orbit, click-vs-drag threshold, zoom, home, and live camera mirroring unchanged.
- [ ] Cell → target mapping is a pure function with no DOM dependency.

## Blocked by

None - can start immediately.
