## What to build

Restyle the resting translate gizmo so each axis arrow is a thin 3px line capped
by the existing cone head, while staying fully grabbable. Replace the solid
cylinder shaft with a screen-space 3px polyline (same mechanism as the rotate
sector strokes). Keep the cone arrowhead. Add a transparent (alpha 0) pick
cylinder running the full shaft length so clicking anywhere along the thin line or
head still grabs the axis. Move/rotate colors unchanged (per-axis RGB). No drag
behavior change in this slice — this is the resting look + pickability only.

## Acceptance criteria

- [ ] Translate shafts render as 3px polylines in the existing per-axis RGB colors.
- [ ] Cone arrowheads retained at the end of each axis.
- [ ] A transparent pick cylinder spans each shaft; clicking the line or head grabs the axis end to end.
- [ ] Hover highlight still works on the full axis (line + head).
- [ ] Existing translate drag still functions (slides object along the axis as before).
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
