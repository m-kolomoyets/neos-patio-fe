## What to build

Align the ViewCube overlay's orbit and zoom to the fixed patio center in view mode
so it agrees with the center-locked map drags and can never nudge the camera
off-axis.

In `useCesiumCamera`, `beginDragOrbit` and `zoomTo` currently pivot on the
viewport-center ground pick. Add a view-mode signal (threaded through the
ViewCube's existing props/context — not global state) that makes both pivot on
`targetRef.current` (the bounds center) instead. Editor behavior (pivot on what you
look at) is preserved unchanged.

Verification-only: confirm the idle orbit still slowly rotates the centered patio
after interaction stops and is interrupted/resumed by ViewCube and map input — no
code change to `useIdleRotation`.

After this slice, map drag, ViewCube orbit/zoom, and idle rotation all pivot on the
same shared center; nothing moves the patio off-center from any control.

## Acceptance criteria

- [ ] In view mode, ViewCube `beginDragOrbit` and `zoomTo` pivot on the bounds center (`targetRef`)
- [ ] View-mode flag threaded via ViewCube props/context; no global state read
- [ ] Editor (`'edit'`) ViewCube pivot behavior unchanged
- [ ] ViewCube orbit/zoom keep the patio centered, consistent with map drags
- [ ] Idle orbit still runs, centered, and is interrupted/resumed by ViewCube + map input (verified, no code change)
- [ ] Tests: view-mode `beginDragOrbit`/`zoomTo` use bounds center; edit-mode uses viewport pick
- [ ] `pnpm tsc` and lint pass

## Blocked by

- Blocked by #02-center-locked-drag-orbit
