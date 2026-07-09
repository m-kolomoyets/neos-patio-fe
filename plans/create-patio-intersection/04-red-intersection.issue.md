## What to build

Live collision feedback. For each patio square that overlaps the center square, the overlap region is painted red and the border segments of both squares inside that region turn red. Implemented with SVG `clipPath` (no boolean geometry, no turf): a red-filled copy of the center rect clipped to the patio path yields the red overlap fill; the center's stroke clipped to the patio plus the patio's stroke clipped to the center yield the red border-inside segments. Rounded corners are respected exactly because the browser performs the clipping. The center square can overlap several patios at once — each overlap is painted independently. Patio-vs-patio overlaps are ignored. Feedback recomputes live while dragging, not only after the map settles.

The exact red value is lifted from the Figma intersection node during implementation.

## Acceptance criteria

- [ ] Overlap region between center and each patio rendered as a red fill via `clipPath`.
- [ ] Border segments of both squares inside an overlap rendered red; segments outside keep their normal color.
- [ ] Multiple simultaneous center-vs-patio overlaps each painted correctly.
- [ ] Patio-vs-patio overlaps are not painted.
- [ ] Overlap updates live during map drag (no settle delay).
- [ ] Rounded corners respected in the clipped intersection.
- [ ] Exact red color matches Figma.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #02-center-square
- Blocked by #03-patio-squares
