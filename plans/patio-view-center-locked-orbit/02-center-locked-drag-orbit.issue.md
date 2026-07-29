## What to build

Add center-locked drag orbit to Patio View. New deep hook
`useViewOrbitControls(viewer, bounds)`, mounted inside `CesiumViewerProvider` in
`PatioView` (renders nothing, same pattern as `IdleOrbit`).

The hook resolves the orbit center via the shared `useOrbitTarget(viewer, bounds)`
(patio bounds center sampled to surface height) and installs a single Cesium
`ScreenSpaceEventHandler`. On `LEFT_DRAG` (mouse), it feeds the pixel delta
`(dx, dy)` to the existing pure `orbitCamera(start, dx, dy, sensitivity)` from
`cameraMath` — `dx` advances heading, `dy` tilts pitch — clamps pitch via
`clampPitch` (display 0–85° band), and applies
`camera.lookAt(center, HeadingPitchRange(heading, pitch, range))` followed by
release of the reference frame, ending in `scene.requestRender()`. The handler is
fully torn down on unmount / viewer change.

After this slice, left-drag orbits the camera around the fixed patio center — the
patio stays dead-center, horizontal drag spins, vertical drag tilts — with zero
drift.

## Acceptance criteria

- [ ] `useViewOrbitControls(viewer, bounds)` exists and is mounted in `PatioView`
- [ ] Mouse left-drag orbits: horizontal → heading, vertical → pitch, around the surface-sampled bounds center
- [ ] Patio center stays exactly centered throughout any drag (camera on the center sphere)
- [ ] Pitch clamped to the display 0–85° band; camera never dips under the map or hits the pole
- [ ] Each move issues a single `scene.requestRender()`; no continuous RAF while idle
- [ ] `ScreenSpaceEventHandler` removed on teardown; no post-destroy camera mutation
- [ ] Drag emits pointer events that stop the idle orbit and re-arm it after release
- [ ] Tests: drag delta → `lookAt` with correct center + HPR (on center sphere); teardown removes handler
- [ ] `pnpm tsc` and lint pass

## Blocked by

- Blocked by #01-native-lockout-drift-removal
