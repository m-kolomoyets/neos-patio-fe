## What to build

Add live feedback to a translate drag, end to end. On grab, freeze the gizmo at
the grab-start origin (the "zero point") — suspend the per-frame re-pin to the
moving object for the drag's duration — and hide the two non-dragged axes. Draw a
growing-arrow overlay: a world-space 3px polyline from the frozen zero point to
the object's live origin (recomputed each frame), a cone head at the growing tip
oriented along the drag axis, and a single dot at the zero point, all in the
dragged axis' color. The arrow grows whether dragging forward or backward. A
`DragReadout` badge anchored to the frozen zero point shows the absolute distance
travelled, auto-scaled (centimetres under 1 m, e.g. `45 cm`; metres at/above 1 m
with 2 decimals, e.g. `1.25 m`), reporting `0` on grab and clearing on release.
Everything tears down on release and on `destroy()`.

## Acceptance criteria

- [ ] On grab, gizmo freezes at the grab-start origin; non-dragged axes hide.
- [ ] Dragged arrow grows from the frozen dot to the object's live position, forward and backward, cone head at the tip touching the object.
- [ ] A dot marks the zero point during the drag.
- [ ] Badge anchored to the zero point shows absolute distance via a pure auto cm/m formatter (`<1 m` → cm, `>=1 m` → m with 2 decimals); shows ~`0` at start and when dragged back.
- [ ] Live distance corresponds to the position committed on release.
- [ ] Overlay, dot, and badge disappear on release and on gizmo `destroy()`; no extra history entry on a bare click.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #1-shared-drag-readout
- Blocked by #2-move-geometry-restyle
