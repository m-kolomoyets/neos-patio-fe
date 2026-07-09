## What to build

Human-in-the-loop visual pass over the completed cube zones in the live editor.

Run the editor against a real patio and exercise every new target: the four
isometric corners, four vertical edges, four top edges. Confirm each snap keeps
the patio bounds filled (no empty ground/sea), the hover wedge/strip/face
highlights match the reference image, and the cube still reads correctly as a
compass + pitch indicator. Tune the pitch values (corner 35° / vertical edge
60° / top edge 30°) live if any framing looks off — these are pure data in the
orientation table and need no logic change.

## Acceptance criteria

- [ ] All four corner iso views keep the patio framed and fully in view.
- [ ] All four vertical-edge and four top-edge views keep the patio framed.
- [ ] Hover highlights (face fill / edge strip / corner wedge) visually match the reference image.
- [ ] Final pitch values signed off (35/60/30 or tuned values recorded in the table).
- [ ] No regression to drag-orbit, flatten-on-face, zoom, or home.

## Blocked by

- Blocked by #02-vertical-edges
- Blocked by #03-top-edges
