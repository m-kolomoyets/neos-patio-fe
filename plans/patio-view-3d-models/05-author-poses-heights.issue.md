# Author correct poses/heights for seeded patios

## What to build

Finalize the seeded fixture data so models seat correctly on the real Google
tileset surface. `PlacedObject.height` is absolute WGS84 altitude; hand-authored
values float or sink. Derive correct absolute heights (and refine HPR/scale) by
placing each object in the editor, reading back its resolved pose, and pasting
those values into the fixtures. Human-in-the-loop: requires visual judgment of
correct seating per patio.

## Acceptance criteria

- [ ] Each seeded object's `height` is a real absolute altitude derived from the tileset surface
- [ ] Models visually rest on the ground (no floating or sinking) in the view
- [ ] HPR and scale reviewed so the composition reads correctly per patio
- [ ] Fixture values captured from actual editor-resolved poses, not guessed

## Blocked by

- Blocked by #02-multi-model-batch-catalog
