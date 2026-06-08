## What to build

A live, on-screen degree readout while a rotation ring is dragged. Instrument
the rotate drag in the transform gizmo to accumulate the signed cumulative angle
about the grabbed axis (summing the per-move deltas it already computes) and to
remember the start-spoke direction. Expose this through new optional rotate
callbacks on the gizmo (`onRotateStart` / `onRotateUpdate(degrees)` /
`onRotateEnd`), fired in rotate mode only. The `useTransformGizmo` hook holds the
live degrees and the gizmo origin in state and surfaces them to `ObjectsLayer`,
which gains a small DOM overlay (`RotationReadout`) that projects the origin to
window coordinates and renders a signed badge (e.g. `+20°`, `-45°`) near the
gizmo. The badge appears on rotate-drag start and disappears on release.

## Acceptance criteria

- [ ] Dragging a rotation ring shows a badge with the live angle in whole degrees, updating continuously.
- [ ] Value is signed (+/−) and reflects drag direction about the grabbed axis.
- [ ] Cumulative angle is correct past 360° and when reversing back toward 0° (reads ~0° when returned to start).
- [ ] Badge is positioned near the gizmo on screen and stays legible over the map background.
- [ ] Badge appears only during an active rotate drag and clears on release.
- [ ] Displayed value matches the orientation committed to the object on release.
- [ ] Translate and scale drags are unchanged (no badge, no behaviour change).
- [ ] No extra history entries; everything torn down on release and on gizmo `destroy()`.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
