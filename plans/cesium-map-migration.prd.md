# PRD: Patio Editor map migration — MapLibre → Cesium (Google Photorealistic 3D Tiles)

## Problem Statement

The Patio Editor renders a 2.5D world: a MapLibre satellite/vector base map with extruded
OSM buildings, and a Three.js overlay (via `react-three-map`) for placing GLTF models.
Users place furniture/objects on a flat-ish map that does not reflect the real, three-dimensional
look of a location. The experience is not photorealistic, the dual render contexts (MapLibre GL +
Three.js) make correct depth/occlusion between the world and placed objects hard, and the stack
cannot stream optimized, level-of-detail 3D content for the actual place a patio sits in.

Users want to design a patio inside a real, photorealistic 3D model of the world, loaded
automatically from the patio's coordinates — with no manually-curated per-location assets — while
keeping everything they can do today: add models from a catalog, move/rotate/scale them, select
them, undo/redo, navigate with the view cube, and have it all autosave.

## Solution

Replace the MapLibre + Three.js rendering stack with a single Cesium scene that streams
**Google Photorealistic 3D Tiles** (global, coordinate-driven, no predefined asset IDs). Placed
objects become native Cesium models sharing one depth buffer with the world, so occlusion is
correct. All existing editor capabilities are preserved and re-implemented against Cesium:
catalog placement, a translate/rotate/scale gizmo, click selection with a highlight outline,
the view-cube navigation widget, idle camera orbit, the properties panel, undo/redo, and autosave.

From the user's perspective:

- Opening a patio loads a photorealistic 3D view of that exact real-world location.
- Objects sit correctly on the real ground surface and are occluded by real geometry.
- Selecting, moving, rotating, scaling, and editing object properties all work as before.
- The view cube, zoom presets, home view, and idle orbit all work as before.

## User Stories

1. As a patio designer, I want the editor to open in a photorealistic 3D view of my patio's real
   location, so that my design reflects how the place actually looks.
2. As a patio designer, I want the 3D world to load automatically from the patio's coordinates,
   so that I never have to pick or upload a location asset.
3. As a patio designer, I want the world to stream in optimized levels of detail as I zoom and
   move, so that the scene stays responsive instead of loading everything at once.
4. As a patio designer, I want to browse a catalog of 3D models, so that I can choose what to place.
5. As a patio designer, I want to click a catalog model to add it at the center of my current view,
   so that it appears where I am looking and not behind a panel.
6. As a patio designer, I want a newly placed object to sit on the real ground surface, so that it
   does not float or sink into the terrain.
7. As a patio designer, I want to drag an object across the ground and have it follow the real
   surface height, so that it stays grounded as I reposition it.
8. As a patio designer, I want to translate a selected object along axes with a gizmo, so that I can
   position it precisely.
9. As a patio designer, I want to rotate a selected object with a gizmo, so that I can orient it.
10. As a patio designer, I want to scale a selected object with a gizmo (per-axis and uniform), so
    that I can size it to fit.
11. As a patio designer, I want to click an object to select it, so that I can edit it.
12. As a patio designer, I want clicking empty ground to deselect, so that I can clear my selection.
13. As a patio designer, I want a selected object to show a highlight outline, so that I can see what
    is selected.
14. As a patio designer, I want my object to stay within the patio bounds, so that I cannot place it
    outside the area I am designing.
15. As a patio designer, I want to edit a selected object's height, heading, pitch, roll, and scale
    as numbers in a properties panel, so that I can make precise adjustments.
16. As a patio designer, I want the panel to show the object's longitude/latitude read-only, so that
    I can see its location without fat-fingering coordinates (I move it via the gizmo instead).
17. As a patio designer, I want to undo and redo placement and transform changes, so that I can
    recover from mistakes.
18. As a patio designer, I want each completed drag to be one undo step, so that undo is predictable.
19. As a patio designer, I want a view-cube widget that mirrors the camera orientation, so that I
    always know which way I am facing.
20. As a patio designer, I want to click a cube face to snap the camera to that orientation, so that
    I can get standard views quickly.
21. As a patio designer, I want to drag the cube to orbit the camera around my patio, so that I can
    inspect the design from any angle.
22. As a patio designer, I want zoom presets and a live zoom indicator, so that I can quickly get to
    a familiar distance.
23. As a patio designer, I want to save and return to a custom home view, so that I can resume from
    my preferred angle.
24. As a patio designer, I want the camera to gently orbit my patio when I am idle, so that the
    presentation feels alive.
25. As a patio designer, I want idle orbit to stop the moment I interact, so that it never fights my
    input.
26. As a patio designer, I want my work to autosave, so that I do not lose changes.
27. As a patio designer, I want the editor to frame my whole patio when it opens, so that I see the
    full area immediately.
28. As a patio designer, I want the scene to stay still and not burn my battery when nothing is
    changing, so that the editor is efficient.
29. As a viewer of the editor, I want the world's data attributions to remain visible, so that the
    product complies with the imagery provider's terms.
30. As a developer, I want all Three.js/MapLibre dependencies removed once unused, so that the
    bundle and dependency surface shrink.
31. As a developer, I want environment variables for the map keys correctly exposed to the client,
    so that the map actually authenticates.

## Implementation Decisions

### Rendering architecture
- **Full-native Cesium (Path A).** Three.js is removed entirely. Placed objects are native Cesium
  models, sharing one depth buffer with the world tiles so occlusion is correct.
- **Raw Cesium, not Resium.** The editor is fundamentally imperative (gizmo, picking, per-frame
  camera, demand render); a declarative wrapper would be bypassed via refs and adds React 19 /
  React Compiler compat risk.
- A single **CesiumViewerProvider** creates the `Viewer` once (imperatively, in an effect against a
  container ref), holds it in context, and exposes a `useCesiumViewer()` accessor. This mirrors the
  current single-instance `useMap()` / `EDITOR_MAP_ID` registry shape so overlay widgets change
  access shape minimally.
- Viewer configuration: `requestRenderMode = true`, `globe.show = false`, default Cesium widgets
  (timeline, animation, baseLayerPicker, geocoder, etc.) disabled, credit container kept mounted
  and visible.

### World content
- **Google Photorealistic 3D Tiles**, loaded with `createGooglePhotorealistic3DTileset` using the
  Google Maps key. Global and coordinate-driven — no predefined asset IDs, no per-patio data
  pipeline. Requires the **Map Tiles API** enabled on the Google key.
- `tileset.showCreditsOnScreen = true`; the Cesium credit container stays visible (provider ToS
  requires displaying data attributions).
- `Cesium.Ion.defaultAccessToken` is set from the Cesium token at boot to silence warnings and keep
  ion assets available later; it is **not** required to render Google tiles.
- A per-patio optional `splatTilesetUrl` field is reserved (not implemented) so a Gaussian-splat
  overlay can be added later without re-architecting. **Gaussian splats are explicitly deferred** —
  there is no global coordinate-driven splat service, so they conflict with the "no predefined IDs"
  requirement and are out of scope here.

### Object model & persistence
- Persisted object format changes from scene-Cartesian + Euler to **geographic + HPR**:
  `{ lng, lat, height, heading, pitch, roll, scale }`. The geo↔scene Mercator projection utility is
  deleted. This is a clean break — existing data is mock (single Lantern), so no migration is
  required.
- Objects load via `Model.fromGltfAsync` and are tagged with an `editorObjectId` so picking can
  distinguish placed models from the world tileset.
- **Ground placement:** new objects spawn at the viewport center via `scene.pickPosition` (one-shot,
  exact, hits the rendered tileset). Dragging re-clamps height via `sampleHeightMostDetailed` so the
  object follows the real surface. The resolved absolute height is stored.
- **Bounds clamping** becomes a geographic rectangle clamp on `lng`/`lat` against
  `[west, south, east, north]`; height comes from surface sampling. Applied on spawn and after a
  translate drag.

### Interaction
- **Transform gizmo:** vendor `zhwy/cesium-gizmo` (Apache-2.0) into the editor module (it is not
  published to npm — copy `src/` and add a hand-written TypeScript declaration). It supports
  translate/rotate/scale/uniform-scale, requires Cesium ≥ 1.102 (project is on 1.142), and operates
  on a `Model.fromGltfAsync` item via its `modelMatrix`. Its `onDragMoving` callback returns
  `Cartesian3` / `HeadingPitchRoll` / scale array, which map directly onto the geographic + HPR
  storage format. Live drag mutates the model; **drag-end commits one history entry** (matches the
  current mouseUp→transform behavior). Risk accepted: it uses low-level `DrawCommand` + custom
  WebGL ES 3.0 shaders and is single-maintainer hobby code — treat as a frozen vendored snapshot,
  pin Cesium, patch on upgrade. Isolated to one vendor folder.
- **Selection:** `scene.pick` on left click; select when the picked primitive carries an
  `editorObjectId`, otherwise deselect. Replaces the Three.js raycaster.
- **Highlight:** per-model `silhouetteColor` / `silhouetteSize` set on select, cleared on deselect.
  Replaces the OutlinePass/EffectComposer chain. `SelectionRaycaster` and `SelectionOutline` are
  deleted.

### Camera & navigation
- ViewCube camera read/write is rewritten against a `lookAt(target, HeadingPitchRange)` model where
  the **target is the patio bounds center sampled to ground height**. The CSS cube and its
  interaction code are kept; only the camera adapter changes.
  - `useCameraState` reads `camera.heading`/`pitch` and derives range from camera position ↔ target
    on `camera.changed`.
  - Camera writers become `camera.flyTo` / `lookAt`.
  - Cube transform keeps heading→`rotateZ`, pitch→`rotateX`; snap/orbit emit `HeadingPitchRange`.
  - **Zoom %** is redefined as a function of camera range (100% = a reference range); the
    `LiveZoomControl` UI is unchanged. `roll` is locked to 0. Home view stores
    `{ heading, pitch, range }` in localStorage as before.
- **Initial framing:** `Rectangle.fromDegrees(west, south, east, north)` via `camera.flyTo` after the
  first tiles load, `heading = 0`, `pitch = -45°`; seeded as the home view.
- **Idle rotation:** ported to a Cesium camera heading-orbit around the bounds target with a
  per-frame `requestRender()`, and **enabled** (previously disabled).

### Render loop
- `requestRenderMode = true`. `scene.requestRender()` is fired centrally on every EditorContext
  mutation (add/remove/transform/select), on gizmo drag, on camera writes, and per-frame via RAF
  only while an animation (idle orbit / fly) is active. Tile streaming triggers renders natively.

### Properties panel
- Option B (editor-friendly): **height, heading, pitch, roll, scale** are editable numeric inputs;
  **lng/lat are read-only** display (position is changed via the gizmo/drag). Matches the gizmo
  feedback path.

### Build & environment
- Add `vite-plugin-cesium` to copy Cesium runtime assets (Workers/Assets/Widgets/ThirdParty) and set
  `CESIUM_BASE_URL` + Widgets CSS. Fallback to `vite-plugin-static-copy` + manual base URL if it is
  incompatible with the project's Vite major.
- Fix env exposure: rename `CESIUM_ACCESS_TOKEN` → `VITE_CESIUM_ACCESS_TOKEN` and
  `GOOGLE_MAPS_API_KEY` → `VITE_GOOGLE_MAPS_API_KEY` in `envSchema`, `.env.local(.example)`, and
  `vite-env.d.ts` (Vite only exposes `VITE_`-prefixed vars to the client). Add the Google key to the
  `ImportMetaEnv` type (currently missing).
- **Dependency cleanup** (all Three.js/MapLibre usage is confined to the PatioEditor module — verified
  nothing outside imports them): remove `maplibre-gl`, `react-map-gl`, `react-three-map`, `three`,
  `@react-three/fiber`, `@react-three/drei`, `@types/three`. Add `vite-plugin-cesium`. Keep `cesium`.

### Proposed module breakdown (deep modules, simple interfaces)
1. **CesiumViewerProvider** — Viewer lifecycle + `useCesiumViewer()`.
2. **geoPlacement** — geographic↔modelMatrix/HPR, surface-height sampling, geographic bounds clamp.
3. **EditorContext** — reducer (geographic+HPR state), undo/redo, centralized `requestRender` fan-out.
4. **ObjectsLayer / ObjectModel** — `Model.fromGltfAsync`, `editorObjectId` tagging, silhouette toggle.
5. **cesium-gizmo adapter** — vendored lib + `.d.ts` + drag→state/history bridge.
6. **selection** — `scene.pick` → select/deselect.
7. **cameraControls** — `lookAt(target, HPR)` read/write hooks consumed by ViewCube.
8. **sceneBootstrap** — P3DT load, credits, ion token, initial bounds framing.
9. **build/env glue** — vite-plugin-cesium wiring + env var renames/types.

## Testing Decisions

- **No automated test runner exists in this repo and the project conventions forbid adding one
  unsolicited.** Therefore this migration is validated by **type-checking, linting, and manual
  verification**, not unit/integration tests.
- Gates that must pass: `npm run tsc` (clean), `npm run lint` (eslint + stylelint + prettier),
  `npm run build` (Cesium assets copied, no missing-worker/base-URL errors), `npm run dev` boot with
  `checkEnv(envSchema)` passing against the renamed env vars.
- Good-test principle if/when tests are later added: assert external behavior, not implementation
  details. The two pure modules most worth covering are **geoPlacement** (geographic↔modelMatrix
  round-trip, bounds clamp at corners/outside, HPR↔orientation) and the **camera math** (heading/pitch
  ↔ cube transform, range↔zoom%, snap orientation), because they are deterministic and ref-free.
- Manual verification checklist (per user stories): patio opens framed in photorealistic 3D; catalog
  add spawns at viewport center on the ground; gizmo translate/rotate/scale each work and commit one
  undo step on release; click selects, empty deselects, silhouette shows; bounds clamp prevents
  out-of-area placement; properties panel edits height/HPR/scale and shows lng/lat read-only; view
  cube mirrors/snaps/orbits, zoom presets + home view work; idle orbit starts after idle and stops on
  interaction; attributions visible; scene idle = no render churn.

## Out of Scope

- **Gaussian splat tilesets / LOD splat capture pipeline.** Deferred; only a reserved
  `splatTilesetUrl` field anticipates it. (Conflicts with the coordinate-driven, no-asset-ID
  requirement.)
- Per-patio splat hosting, ion asset provisioning, splat↔mesh depth compositing.
- Provisioning/enabling the Google **Map Tiles API** on the API key (ops task, flagged not done).
- Real model catalog content/hosting — the models service remains mocked (single Lantern sample).
- Migration of any existing persisted patio data (none exists beyond mock).
- Adding a test runner or test suite.
- Multi-viewer / multiple simultaneous patio scenes.
- Google Photorealistic vs. ion-proxied Google decision is settled (direct Google key).

## Further Notes

- The originally-linked reference (3D Tiles Gaussian Splats with LOD Sandcastle) is **not** the
  correct reference for this work; the relevant reference is the **Google Photorealistic 3D Tiles**
  Sandcastle, because the hard requirement is coordinate-driven loading with no predefined IDs.
- `vite-plugin-cesium` Vite-major compatibility must be verified during implementation; auto-fallback
  to `vite-plugin-static-copy` + manual `CESIUM_BASE_URL` if needed.
- The vendored `cesium-gizmo` is a frozen snapshot the team now owns: pin Cesium, expect to patch the
  gizmo's `DrawCommand`/shader code on future Cesium upgrades.
- Forgetting a `scene.requestRender()` after a mutation is the most likely class of bug under
  `requestRenderMode`; centralizing mutation→render through EditorContext mitigates it.
- Legal: hiding the Google data attributions violates the imagery ToS — the credit container must
  remain visible in any final chrome styling.
