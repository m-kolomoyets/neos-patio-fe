# Create-Patio Map Controls

## Problem Statement

On the Create-Patio screen users navigate a top-down Mapbox satellite/globe map to find and place their patio, but the map offers no on-screen controls. To zoom, rotate, or reorient they must rely on mouse/trackpad gestures, and there is no way to jump to their real-world location or to snap the map back to north. Finding your own yard on a globe by dragging is slow and disorienting.

## Solution

Add a compact vertical control bar in the **bottom-left corner** of the Create-Patio map (matching the Figma "Action Bar" block). It exposes:

- **Magnet** — placeholder button, no behavior yet (reserved for future snapping).
- **Location** — fly the camera to the user's current GPS location (with browser permission handling).
- **Zoom + / −** — step the map zoom in/out.
- **Rotate ← / →** — rotate the map 90° per tap in the arrow's direction.
- **Compass** — a live needle that orients to north; tapping it snaps the map back to north-up.

The bar is present only on the Create-Patio route and is always visible from the initial globe view onward.

## User Stories

1. As a patio creator, I want on-screen zoom buttons, so that I can move off the globe and in/out of the map without relying on scroll gestures.
2. As a patio creator, I want a "location" button, so that I can jump straight to my real-world address instead of dragging across the globe.
3. As a patio creator, I want the map to ask for location permission when I request it, so that my privacy is respected.
4. As a patio creator, if I have denied location permission, I want the location button to be disabled, so that I'm not prompted repeatedly for an action that can't succeed.
5. As a patio creator, when location lookup fails (timeout/unavailable), I want a toast telling me so, so that I understand why nothing happened.
6. As a patio creator, while my location is being fetched, I want the button to show a loading state, so that I know the app is working.
7. As a patio creator, I want to rotate the map 90° left or right per tap, so that I can orient the satellite view to match how I think about my plot.
8. As a patio creator, I want a compass whose needle always points to true north, so that I can tell the map's current orientation at a glance.
9. As a patio creator, I want to tap the compass to reset the map to north-up, so that I can quickly recover a known orientation after rotating.
10. As a patio creator, I want the rotate arrows and compass to stay in sync, so that the orientation shown is always consistent.
11. As a patio creator, I want the control bar in the bottom-left corner from the moment the screen loads, so that the zoom-in button is available to leave the globe.
12. As a patio creator, I want camera moves (fly, rotate, north-reset) to animate smoothly, so that I don't lose spatial context.
13. As a patio creator with reduced-motion enabled, I want those camera moves to be instant, so that motion doesn't cause discomfort.
14. As a patio creator, I want a magnet button visible in the bar, so that the layout matches the final design even though its behavior ships later.
15. As a patio creator, I want the controls to not overlap the scale bar or the map-view tabs, so that the UI stays legible.

## Implementation Decisions

**Scope**
- Controls live **only** in the Create-Patio route (`src/modules/CreatePatio`). Not in PatioView (Cesium) or PatioEditor. The Create-Patio map is **Mapbox GL** via `react-map-gl/mapbox`, not Cesium — all camera operations use the native Mapbox map API.

**Modules (new, Create-Patio-local)**
- `MapControls` — presentational component rendering the Figma layout: a vertical stack (magnet → location → zoom +/− group) plus a bottom row (rotate ←/→ group + compass). Reuses `ui/Button` (`isIcon`, `variant="surface"`) inside `surface-regular` pill wrappers. Mounted as a sibling of `<Map>` inside `.map-clip`, positioned `position: absolute; left/bottom: var(--gap-2)`.
- `useCreatePatioMap()` — hook returning the underlying Mapbox map instance, wrapping the established access pattern `(useMap().current ?? useMap()[CREATE_PATIO_MAP_ID])?.getMap()`. Single source of truth for the map handle.
- `useMapBearing()` — live bearing value, subscribing to map `rotate`/`render` events in an effect and storing bearing in state (same event-driven pattern as `useZoomAtLeast`). Drives the compass needle rotation and is the read side for the rotate buttons.
- `useGeolocateToMap()` — encapsulates `navigator.geolocation.getCurrentPosition`, permission state via `navigator.permissions.query({ name: 'geolocation' })`, loading state, and the resulting `flyTo`. Exposes `{ request, status, isDenied }`.

**Behavior**
- **Magnet**: renders a button; `onClick` is a no-op for now.
- **Location**: on click, request current position; on success `map.flyTo({ center: [lng, lat], zoom: ~16 })` — street-level so the user sees their actual property. No marker is dropped; camera move only. If permission is denied, the button is **disabled** (reactively, via the Permissions API). On timeout/unavailable, show a Toast (`src/components/ui/Toast`). While fetching, button shows a loading/disabled state.
- **Zoom + / −**: native `map.zoomIn()` / `map.zoomOut()` (±1 level, eased). Respects the existing `minZoom` (`GLOBE_MIN_ZOOM`).
- **Rotate ← / →**: relative quarter-turn — `map.easeTo({ bearing: currentBearing ∓ 90 })`, wrapped mod 360. Left arrow decrements, right increments (animated).
- **Compass**: needle icon rotated by `-bearing` (from `useMapBearing()`), always visible even at bearing 0. Click → `map.resetNorth()` (Mapbox built-in animated reset to north-up). Shares the same live bearing as the rotate buttons, so display stays consistent.
- **Reduced motion**: all camera moves (fly, rotate, resetNorth) gate their animation on the existing `prefersReducedMotion()` util — `duration: 0` (instant) when reduced motion is set, eased otherwise.

**Visibility / placement**
- Always visible from the initial globe view (not zoom-gated, not create-mode-gated). Bottom-left is free (ScaleBar is top-left, MapViewTabs top-center), so no overlap.

**Icons**
- Two new SVGs downloaded from the Figma UI-kit and added to `src/icons/`, imported via Vite `?react`:
  - `location_24.svg` (UI-kit node `9080-351`)
  - `magnet_24.svg` (UI-kit node `9080-36`)
- Existing icons reused: `compass_24`, `plus_24`, `minus_24`, and `redo_24`/`undo_24` (rotate arrows).

**Naming note**
- The Figma frame is named "Action Bar", but `src/components/ActionBar` already exists (the top search/wallet bar). The new component is therefore named `MapControls` to avoid collision.

## Testing Decisions

This repo has **no test runner configured** (see `.claude/rules/code-style.md` — "No unit/e2e"). Therefore no automated tests are written for this feature.

Verification is manual + static:
- `pnpm tsc` (type check) and `pnpm lint` (eslint + stylelint + prettier) must pass — enforced by the Husky `pre-push` hook.
- Manual smoke test in the Create-Patio route: zoom in/out off the globe, rotate ± and confirm 90° quarter-turns, confirm compass needle tracks bearing and reset snaps to north, exercise the location button across grant/deny/timeout, and confirm reduced-motion produces instant moves.

The hooks (`useCreatePatioMap`, `useMapBearing`, `useGeolocateToMap`) are written as isolated units with narrow interfaces so they *could* be unit-tested if a runner is later added.

## Out of Scope

- Magnet functionality (snapping) — button ships as a no-op placeholder.
- A "you are here" location marker — location does a camera move only.
- Clamping the location fly-to into any patio bounds — fly to the raw GPS coordinate.
- Persisting any state across sessions (permission grant is read live from the Permissions API, not stored).
- Adding these controls to PatioView (Cesium) or PatioEditor.
- Any change to the existing Cesium `ViewCube` controls.
- Continuous location tracking / following (single fly-to per tap only).

## Further Notes

- The Create-Patio map already establishes the live-subscription pattern (`useZoomAtLeast`, `useScaleBarDriver`) — the new bearing/geolocation hooks follow the same effect-based `map.on(...)` / cleanup approach.
- `dragRotate` is already enabled on the map, so bearing can be non-multiple of 90 from free rotation; the rotate buttons deliberately apply a *relative* ±90 rather than snapping to the nearest grid line.
- `maxPitch` is 0 (top-down), so no pitch handling is needed anywhere in these controls.
