## What to build

Make the cube interactive: click to snap the camera to a known orientation, drag to orbit the camera directly.

**Click-to-snap** — 9 targets (top face + 4 side faces + 4 corners; edges intentionally unsupported), each mapping to a `{ bearing, pitch }` applied via `easeTo({ duration: 400 })`:
- Top → pitch 0 (top-down), bearing unchanged.
- Side N/E/S/W → bearing 0/90/180/270, pitch 85 (pseudo-elevation).
- Corner NE/SE/SW/NW → bearing 45/135/225/315, pitch 60 (3/4 view).

**Drag-orbit** — horizontal drag Δx → `bearing += Δx·k`, vertical drag Δy → `pitch += Δy·k` (clamped 0–85), updated live/instant per move. Free release (no snap on release). Maplibre's own interaction handlers are disabled while the cube is being dragged, re-enabled on release. A click (no meaningful drag) triggers snap; a drag does not.

The target → camera table lives in `constants.ts`; the mapping/clamp/sign math lives in pure helpers in `utils/`.

## Acceptance criteria

- [ ] Clicking each of the 9 targets snaps the camera to the specified bearing/pitch via `easeTo` (400ms).
- [ ] Top→pitch 0, sides→pitch 85 + bearing snap, corners→pitch 60 + 45°-offset bearing.
- [ ] Dragging the cube horizontally rotates bearing and vertically tilts pitch, live and instant, clamped to 0–85 pitch.
- [ ] Drag release leaves the camera where it is (no snap-on-release).
- [ ] Maplibre interaction handlers are disabled during cube drag and restored after.
- [ ] A click is distinguished from a drag (small movement = click = snap).
- [ ] Camera-target and bearing-math logic isolated in `constants.ts` / `utils/` (pure, would be unit-testable).
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #02-live-css-viewcube-indicator
