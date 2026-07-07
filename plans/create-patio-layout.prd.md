# Create Patio Layout Rework — PRD

## Problem Statement

The Create Patio screen is a bare, full-screen Mapbox satellite map with no chrome. It does not
match the rest of the app: there is no framing surface, no way back to Home, no title, no place
search, and no controls. A creator dropped onto this screen cannot orient themselves, cannot find a
real-world location, cannot tell whether they are zoomed in enough to place a patio, and has no
distinction between *browsing* existing patios and *placing* a new one. There is also no entry point
to the screen from Home.

## Solution

Re-dress the Create Patio screen so it reads as a first-class page consistent with Home:

- The map lives inside the same rounded (squircle) surface block Home uses, with the shared Action
  Bar floating over it.
- A static header sits at the top of the surface: a back button, a centered "Create patio" title,
  an always-visible place-search input, and a single mode/zoom button.
- That button is the spine of the interaction. When the map is zoomed too far out for a 100×100 m
  patio to be meaningfully placed, it reads **Zoom in** and, on click, flies the camera to a zoom
  where 100 m fills a large share of the screen. Once zoomed in enough it reads **Create patio** and,
  on click, switches the screen into *create mode*.
- The screen has two modes. In **view mode** the creator pans and rotates the map and inspects
  existing patios. In **create mode** the always-present center square is treated as the footprint
  of the patio being created; clicking any existing patio drops back to view mode.
- The map can be rotated by azimuth (bearing) only — never tilted. The center square always appears
  as an upright, unrotated square on screen, while its real-world orientation follows the map
  bearing; existing patio squares stay pinned to the world and visually rotate with it.
- Home gains a "Create patio" trigger so the screen is reachable.

## User Stories

1. As a creator, I want the Create Patio screen framed in the same rounded surface as Home, so that
   the app feels consistent and I know I'm still inside it.
2. As a creator, I want the shared Action Bar available on the Create Patio screen, so that I can
   search patios, connect my wallet, and open XR from here just like on Home.
3. As a creator, I want a back button in the header, so that I can return to Home at any time.
4. As a creator, I want a clear "Create patio" title centered in the header, so that I know what
   screen I'm on.
5. As a creator, I want an always-visible place-search input in the header, so that I can jump the
   map to a real-world address or city instead of panning manually.
6. As a creator, I want selecting a place-search result to fly the map to that location at a
   street-level zoom, so that I land somewhere useful immediately.
7. As a creator, when the map is zoomed too far out for a 100×100 m patio to be placed, I want the
   header button to read "Zoom in", so that I understand the next step.
8. As a creator, I want clicking "Zoom in" to smoothly fly the camera to a zoom where a 100 m
   footprint fills a large portion of the screen, so that I can see the placement area clearly.
9. As a creator, once the map is zoomed in enough, I want the button to switch to "Create patio",
   so that I know I can now start placing.
10. As a creator, I want clicking "Create patio" to switch the screen into create mode, so that the
    center square becomes the footprint of the patio I'm about to create.
11. As a creator in create mode, I want the header button to revert to "Zoom in", so that I can
    still fine-tune the camera zoom while placing.
12. As a creator, I want a center square always visible on screen, so that I always see where a new
    patio would be positioned relative to the viewport.
13. As a creator, I want the center square to show red collision/intersection wherever it overlaps
    an existing patio — in both view and create mode — so that I always know when a spot is taken.
14. As a creator in view mode, I want to click existing patios on the map, so that I can investigate
    them (selection now; detail content later).
15. As a creator in create mode, I want clicking an existing patio to drop me back to view mode and
    select it, so that inspecting a neighbor doesn't fight with placing.
16. As a creator, I want to rotate the map by azimuth, so that I can orient the world to suit the
    patio I'm placing.
17. As a creator, I want the map to never tilt out of top-down, so that footprints stay readable as
    flat squares.
18. As a creator, I want the center square to always look like an upright square regardless of map
    rotation, while its real-world orientation matches the current bearing, so that the placement
    reticle stays legible but the recorded footprint is correctly oriented.
19. As a creator, I want existing patio squares to rotate with the world as I rotate the map, so
    that they stay pinned to their real locations.
20. As a browsing user on Home, I want a "Create patio" trigger before the library filters, so that
    I can start creating a patio from the library.
21. As a developer, I want the Action Bar extracted to a shared component decoupled from the Home
    route, so that Home and Create Patio render the identical bar without duplication.

## Implementation Decisions

### Layout / surface
- The `CreatePatio` module wraps its content in a Home-style squircle surface: reuse
  `useSquircleClipPath`, the `surface-regular` treatment, a hairline border, and `overflow:hidden`.
- The surface is a flex column: a static in-flow **Header** on top, then the **Map** filling the
  remaining space. The map changes from a fixed full-viewport element to filling the map region
  inside the surface.
- The shared **Action Bar** is absolutely positioned over the surface, identical to Home.

### Header
- Three-zone grid so the title is truly centered regardless of side content widths.
- Left: back button → navigates to `/`.
- Center: static "Create patio" title (Typography).
- Right: always-visible geocoder search input + the mode/zoom toggle button.

### Mode + zoom button state machine
- Module-level `CreatePatioContext` provides `mode` (`view` | `create`, default `view`) and its
  setter, mirroring the `PatioEditor` context convention. Consumers: header button, squares overlay,
  map click handler.
- `zoomEnough` is derived from the pixel footprint of a 100 m square at the current camera:
  `metersToPixels(100, latitude, zoom) >= ZOOM_ENOUGH_RATIO * min(viewportW, viewportH)` with
  `ZOOM_ENOUGH_RATIO = 0.5`.
- Button truth table:
  - view + not zoomed enough → "Zoom in" → fly to target zoom.
  - view + zoomed enough → "Create patio" → set mode to create.
  - create (any zoom) → "Zoom in" → fly to target zoom.
- The "Zoom in" fly target is the zoom where `metersToPixels(100) = ZOOM_IN_TARGET_RATIO * minDim`
  with `ZOOM_IN_TARGET_RATIO = 0.6` (chosen above the 0.5 threshold so the button reliably flips to
  "Create patio" after the fly, no flicker). Target zoom is computed by inverting `metersToPixels`.
  `flyTo` is animated; center is unchanged (recenters on current center).
- Both ratios are named constants.

### Modes / overlay behavior
- The center square is always rendered and always paints red intersection/collision against
  existing patios — this is not gated by mode.
- In create mode the center square is semantically the footprint (bounds) of the patio to create.
- Existing patio squares are clickable in both modes via point-in-rotated-rect hit-testing.
  Clicking a patio in create mode switches to view mode and selects it. Info/detail content for a
  selected patio is deferred; this pass is selection only.

### Rotation
- Mapbox: enable bearing rotation (`dragRotate`), lock pitch to top-down — `pitchWithRotate={false}`,
  `maxPitch={0}`, and disable touch pitch. Azimuth/bearing is the only permitted camera rotation.
- `useMapCamera` additionally exposes `bearing`.
- Center square: drawn axis-aligned in screen space (screen azimuth = 0) regardless of bearing; its
  semantic bounds azimuth equals the live map bearing.
- Existing patio squares: screen azimuth = `worldAzimuth − bearing`, so they stay pinned to the
  world and visually rotate as the map rotates.
- `useAzimuth` becomes derived from the map bearing; the manual azimuth setter is dropped.

### Geocoder search
- New `geocoding` service following repo conventions: a ky call to the Mapbox Geocoding REST API,
  a hierarchical query-key factory, and `queryOptions`/hook wrappers. No new npm dependency.
- Reuse the existing `Autocomplete` primitives (mirroring `PatioAutocomplete` + the debounced
  `useActionBarSearch` pattern) for the header input.
- Selecting a result flies the map to the result center at street-level `DEFAULT_ZOOM` (16). It does
  not change mode. Uses the existing `VITE_MAPBOX_TOKEN`.

### Shared Action Bar
- Move the Home `ActionsBar` folder (including its `PatioAutocomplete` sub-component,
  `useActionBarSearch` hook, and constants) to a shared components location.
- Replace the route-scoped `useHomeNavigate` with the router's plain `useNavigate()` so the bar
  works on any route. Home and Create Patio both render the identical `<ActionBar/>`.

### Route + Home entry point
- `create-patio` lazy route at path `/create-patio`, lazy-only (no `validateSearch`/`loader`, so no
  non-lazy half). Add a `useCreatePatioRouteApi` hook per convention.
- Home gains a "Create patio" trigger (Button with `plus_24` icon + label) as the first child of the
  library toolbar, before the filters, navigating to `/create-patio`.

## Testing Decisions

This repo has **no test runner configured** (per CLAUDE.md) and none is to be added. "Tests" here
means manual verification plus identifying pure seams that *could* be unit-tested if a runner is
introduced later.

- Good tests would assert external behavior, not implementation details.
- Pure, isolatable seams worth covering (candidates, not to be wired up now):
  - `metersToPixels` — meters→pixels across latitude and zoom (already pure).
  - The target-zoom inversion — given a desired pixel footprint and camera latitude, returns the
    zoom that yields it; round-trips with `metersToPixels`.
  - The `zoomEnough` predicate — boundary behavior right at `0.5 * minDim`.
  - Point-in-rotated-rect hit-testing — points inside/outside a rotated square, including corners
    and rotation by bearing.
  - Screen-azimuth math for existing patios (`worldAzimuth − bearing`) and bearing wraparound.
- Manual verification checklist:
  - Button label transitions across zoom in/out and view/create modes match the truth table.
  - "Zoom in" lands above the threshold so the button flips to "Create patio".
  - Rotating the map keeps the center square visually upright while existing patios rotate; pitch
    can never leave top-down.
  - Intersection/red collision paints in both modes.
  - Geocoder result flies to street-level zoom; Action Bar behaves identically on Home and Create
    Patio; back button returns to Home; Home trigger opens the screen.

## Out of Scope

- Patio persistence / a create API and navigation into the `/patios/$id` editor from create mode.
- Selected-patio info/detail popup content (selection only this pass).
- Any rotation control UI (rotation is via map drag only; no azimuth slider/menu).
- Reworking the Cesium `PatioEditor`.
- Adding a test runner or automated tests.

## Further Notes

- The opaque satellite map fills the surface, so the `surface-regular` translucency/blur is hidden
  behind it — only the squircle clip and border are visually meaningful for the map region.
- Earlier stray TypeScript diagnostics referenced a richer header (a `Menu`/`OptionItem`/scale
  control for azimuth presets). That is **not** part of this plan; rotation is map-drag only.
- Start location and mock patio generation (Barcelona seed, deterministic `seededPatios`) are
  retained as-is.
