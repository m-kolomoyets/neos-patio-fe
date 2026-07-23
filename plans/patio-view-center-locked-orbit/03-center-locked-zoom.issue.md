## What to build

Add center-locked zoom to `useViewOrbitControls` for both desktop and mobile.

Extend the hook's `ScreenSpaceEventHandler` to handle `WHEEL` (mouse/trackpad) and
`PINCH` (two-finger touch): each computes a new range = current distance-to-center
± delta, clamps it to the controller's `minimumZoomDistance`/`maximumZoomDistance`
band, and applies `camera.lookAt(center, HeadingPitchRange(currentHeading,
currentPitch, clampedRange))` + `scene.requestRender()`. Heading and pitch are
preserved — only range changes — so the patio stays centered at every zoom.

Also confirm `LEFT_DRAG` (from slice #2) already covers one-finger touch drag so
mobile orbit works. Calibrate wheel/pinch sensitivity against the previous native
zoom feel.

After this slice, wheel + pinch + trackpad zoom all keep the patio dead-center,
bounded to the near/far band, on desktop and mobile.

## Acceptance criteria

- [ ] `WHEEL` changes only range around center; heading/pitch preserved
- [ ] `PINCH` (two-finger touch) zooms toward/away from center; heading/pitch preserved
- [ ] Range clamped to `minimumZoomDistance`/`maximumZoomDistance`; cannot dolly into ground or out to orbit
- [ ] One-finger touch drag orbits (verifies `LEFT_DRAG` touch coverage)
- [ ] Zoom sensitivity feels comparable to the prior native zoom
- [ ] Tests: wheel/pinch delta → range-only change, clamped to band, center preserved
- [ ] `pnpm tsc` and lint pass

## Blocked by

- Blocked by #02-center-locked-drag-orbit
