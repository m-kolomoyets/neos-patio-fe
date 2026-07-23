# Patio View — Center-Locked Orbit Camera

## Problem Statement

On the read-only Patio View page, the user can currently drag the map far enough
that the patio drifts off toward the edge of the frame before the camera snaps
back. The place they came to look at does not stay put — a left-drag walks the
focus off the patio (up to ~2 km) and then jerks back when a hidden clamp fires.
It feels loose and lets the user "get lost" away from the one coordinate the page
exists to show.

The user wants the Patio View camera pinned to the patio's center. Dragging should
turn the camera *around* that center like a turntable — never travel away from it.
Zooming stays available, but even zoom must keep the patio dead-center. In short:
the camera orbits the initial patio coordinate and can never leave it.

## Solution

Replace the "free-drift-then-snap-back" model in Patio View with a strict
center-locked orbit:

- Left-drag (mouse or one-finger touch) orbits the camera around the fixed patio
  center — horizontal drag spins the heading, vertical drag tilts the pitch — with
  the patio center held exactly in view the whole time.
- Wheel and pinch zoom change only the distance to that same fixed center, so the
  patio stays centered at every zoom level.
- The camera position is always on a sphere around the patio center. There is no
  panning, no drift, and therefore no snap-back correction.
- Pitch is clamped to a safe band so the camera never dips under the map or hits
  the pole; zoom is clamped to the existing near/far band.
- The ambient idle orbit, the ViewCube overlay, and the loading/framing behavior
  all continue to work and stay consistent with the new center-locked model.

This applies to Patio View only (`interaction="view"`). The Patio Editor's free
camera is untouched.

## User Stories

1. As a Patio View visitor, I want the patio to stay centered when I drag, so that
   I never lose sight of the place I came to see.
2. As a Patio View visitor, I want a horizontal drag to rotate the camera around
   the patio, so that I can inspect it from any compass direction.
3. As a Patio View visitor, I want a vertical drag to tilt the camera up and down
   around the patio, so that I can view it from a higher or lower angle.
4. As a Patio View visitor, I want the camera to never travel away from the patio
   center, so that I cannot accidentally "get lost" over empty ground.
5. As a Patio View visitor, I want to zoom in and out with my mouse wheel, so that
   I can see the patio closer or farther.
6. As a Patio View visitor, I want zooming to keep the patio centered, so that the
   view never slides off-target as I zoom.
7. As a Patio View visitor, I want zoom bounded to a sensible near/far range, so
   that I can never dolly into the ground or out into orbit.
8. As a Patio View visitor, I want the tilt bounded so the camera never goes under
   the map or flips over the top, so that the view is always upright and readable.
9. As a mobile Patio View visitor, I want one-finger drag to orbit the patio, so
   that the touch experience matches desktop.
10. As a mobile Patio View visitor, I want pinch to zoom toward/away from the
    patio center, so that I can zoom naturally on a phone without losing the patio.
11. As a Patio View visitor, I want the camera to stop drifting or jerking back
    into place, so that the interaction feels solid and intentional.
12. As a Patio View visitor, I want the ViewCube to orbit and zoom around the same
    fixed patio center as my map drags, so that both controls agree and nothing
    nudges the patio off-center.
13. As a Patio View visitor, I want the ambient idle rotation to keep slowly
    orbiting the centered patio after I stop interacting, so that the page stays
    alive without wandering off.
14. As a Patio View visitor, I want my drag/zoom to immediately interrupt the idle
    orbit and resume it after I stop, so that the camera never fights my input.
15. As a Patio Editor user, I want my free camera (pan/fly/free-orbit) to be
    completely unaffected, so that the editor keeps working exactly as before.
16. As a developer, I want the obsolete pan-drift clamp and its constants removed,
    so that the view-mode camera code has a single clear model with no dead paths.

## Implementation Decisions

- **Model reframe.** Patio View drops the native "orbit-around-cursor + drift then
  snap back to a 2 km disc" model in favor of a strict fixed-center orbit. The
  camera position is always on a sphere around the patio center; every move is
  expressed as `lookAt(center, HeadingPitchRange(heading, pitch, range))`.

- **New deep hook `useViewOrbitControls(viewer, bounds)`.** Mounted inside
  `CesiumViewerProvider` in Patio View (same pattern as the existing `IdleOrbit`
  renders-nothing hook). Responsibilities:
  - Resolve the orbit center via the shared `useOrbitTarget(viewer, bounds)`
    (patio bounds center sampled to real surface height) — the identical pivot the
    ViewCube and idle orbit already use, so there is no seam between controls.
  - Install a single Cesium `ScreenSpaceEventHandler` on the canvas that handles:
    - `LEFT_DRAG` (mouse and one-finger touch) → orbit. Delta `(dx, dy)` fed to the
      existing pure `orbitCamera(start, dx, dy, sensitivity)` from `cameraMath`;
      `dx` advances heading, `dy` tilts pitch. Pitch clamped by the existing
      `clampPitch` (display 0–85° band).
    - `WHEEL` and `PINCH` → range change around center. New range clamped to the
      controller's `minimumZoomDistance`/`maximumZoomDistance` band, then applied
      as `lookAt(center, HPR(currentHeading, currentPitch, clampedRange))`.
  - Each move ends in `scene.requestRender()` (respecting `requestRenderMode`), and
    zooms/drags need a render pump only if animated (drags/zooms here are instant).
  - Full teardown of the handler on unmount / viewer change.

- **`applyInteractionMode('view')` simplified** in `sceneBootstrap`:
  - Disable *all* native camera inputs in view mode: `enableRotate`, `enableTilt`,
    `enableZoom`, `enableTranslate`, `enableLook` → `false`. Zero the inertias.
  - Keep setting `controller.minimumZoomDistance`/`maximumZoomDistance` (the zoom
    band). These remain the single source of truth for the zoom clamp — read by
    both `useViewOrbitControls` and the ViewCube's `clampRange`.
  - Remove `installPanClamp`, `VIEW_MAX_PAN_METERS`, and `VIEW_MAX_PITCH`
    entirely (pitch is now clamped by `clampPitch` in the hook; there is no pan to
    clamp). `applyInteractionMode('view')` returns a no-op teardown.
  - `'edit'` mode is unchanged (native controller, no-op).

- **ViewCube aligned to center in view mode.** `useCesiumCamera`'s `beginDragOrbit`
  and `zoomTo` currently pivot on the viewport-center ground pick. In view mode
  they instead pivot on `targetRef.current` (the bounds center) so the ViewCube can
  never nudge the camera off the axis the map drags hold. Editor behavior (pivot on
  what you look at) is preserved. The hook needs to know it is in view mode; this is
  threaded through the ViewCube's existing props/context rather than reading global
  state.

- **Idle rotation untouched.** `useIdleRotation` keeps orbiting the viewport-center
  ground hit; with the camera now always centered, that pivot naturally converges
  on the bounds center, and the hook's existing DOM interaction detection already
  stops the orbit during our drags/zooms and re-arms after idle. No edit to the
  shared editor hook.

- **Center definition.** "Center" = patio bounds center sampled to real surface
  height (`useOrbitTarget`), seeded at ellipsoid height until the surface sample
  resolves — identical to ViewCube and idle orbit. Not the ellipsoid-height
  `boundsCenter` the old pan clamp used.

## Testing Decisions

Good tests here assert *external behavior* — given an input gesture and a starting
camera state, the resulting orientation is correct and stays on the center sphere —
not the internal wiring of Cesium event handlers. Prefer testing the pure math the
hook delegates to, and thin behavioral checks on the hook's contract.

- **Pure math (primary coverage), already the right seam:**
  - `orbitCamera(start, dx, dy, sensitivity)` — heading advances with `dx`, pitch
    with `dy`; verify direction/sign and scaling. (Reused, likely already covered;
    extend if gaps.)
  - `clampPitch` — pitch never leaves the display 0–85° band, including inputs past
    both ends. Prior art: existing `cameraMath` tests.
  - Range clamp — a range below/above the band clamps to
    `minimumZoomDistance`/`maximumZoomDistance`; in-band ranges pass through.
- **`useViewOrbitControls` behavior (with a mock/stub viewer):**
  - A drag delta produces a `lookAt` whose target is the resolved center and whose
    HPR matches `orbitCamera` output — i.e. the camera stays on the center sphere.
  - A wheel/pinch delta changes only range (heading/pitch preserved), clamped to
    the band.
  - Teardown removes the `ScreenSpaceEventHandler` (no leak / no post-destroy
    mutation), mirroring the existing bootstrap teardown tests.
- **`applyInteractionMode('view')`:** sets the five native flags to `false`, zeros
  inertias, sets the zoom band, and installs no pan/pitch listeners. Prior art:
  existing sceneBootstrap tests for the current view-mode setup.

Ask the user which modules beyond these unit tests warrant additional (integration
/ interaction) tests — candidate: an end-to-end drag→orbit assertion against a real
`Viewer` if the harness supports it.

## Out of Scope

- The Patio Editor camera (`interaction="edit"`) — entirely unchanged.
- Any change to the initial framing (`bootstrapScene`/`frameBounds`), heading/pitch
  defaults, or the zoom-band factor values.
- ViewCube visual/widget behavior beyond re-pointing its orbit/zoom pivot to center
  in view mode.
- Idle-rotation timing, speed, or pivot logic.
- Persisting camera state / Home-view storage.
- Mobile layout/UI (only the touch *gesture* mapping is in scope).

## Further Notes

- The existing `useCesiumCamera.beginDragOrbit` proves the fixed-pivot `lookAt`
  drag-orbit model already works in this codebase; this feature applies the same
  model to the map canvas itself and re-points the pivot to the fixed bounds center.
- Watch the interplay with idle rotation and the ViewCube: all three now drive the
  camera via `lookAt` around the same shared `useOrbitTarget` center, so there
  should be no pivot seam. Verify no handler feeds another (idle already ignores
  its own `lookAt`; our handler emits real pointer events that correctly stop idle).
- Trackpad vs mouse wheel delta normalization is the main hand-rolled risk in the
  `WHEEL`/`PINCH` path; calibrate sensitivity against the current native zoom feel.
