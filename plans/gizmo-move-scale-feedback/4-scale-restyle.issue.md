## What to build

Restyle the resting scale gizmo so it reads as the distinct, uniform operation it
is. Make the cubes a little smaller. Add a thin 3px axis line from the origin to
each cube. Recolor scale (cubes + lines) to grey `hsla(0, 0%, 67%, 1)` at rest,
turning yellow on the hovered axis. This is scale-mode only — move and rotate
colors are untouched. No drag-follow behavior in this slice (uniform scaling still
works as today); this is the static look + hover.

## Acceptance criteria

- [ ] Scale cubes are a little smaller than current.
- [ ] A 3px axis line runs from origin to each cube.
- [ ] Cubes and lines are grey `hsla(0,0%,67%,1)` at rest.
- [ ] Hovering an axis turns that axis (cube + line) yellow; others stay grey.
- [ ] Move and rotate colors are unchanged.
- [ ] Existing scale drag still scales the model uniformly.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
