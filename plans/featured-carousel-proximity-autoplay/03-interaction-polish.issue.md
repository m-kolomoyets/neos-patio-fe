## What to build

Harden the proximity autoplay against real interaction. Pause stepping while the user drags the carousel (embla `pointerDown`) and resume on release (`pointerUp`) if the cursor is still in the zone — manual control wins. Cache arrow centers and refresh them on window `resize` and embla `reInit` (matching the magnetic scrub hook's pattern) so proximity math stays accurate. Ensure rapid cursor entry/exit never leaves a dangling timer, and that idle hover near an arrow still triggers the existing magnetic video tease (coexistence with the scrub hook).

## Acceptance criteria

- [ ] Dragging the carousel pauses autoplay; releasing resumes it if cursor remains in the zone.
- [ ] Arrow centers refresh on `resize` and embla `reInit`; proximity stays correct after layout changes.
- [ ] Rapid cursor entry/exit leaves no dangling timer (verified via cleanup on effect teardown and zone-exit).
- [ ] Idle hover near an arrow (not advancing) still teases the in-view video via the existing magnetic scrub — no regression.
- [ ] All listeners and timers removed on unmount.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-forward-proximity-autoplay
