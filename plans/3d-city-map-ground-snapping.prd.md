# PRD: 3D City Map + Ground-Snapping Placement

## Problem Statement

In the Patio Editor, the map is a flat satellite image (Esri raster) tilted at 45°. There is no real terrain relief and no buildings, so the scene does not read as a real place. Worse, every 3D model is placed at sea level (`alt: 0`), so on any real-world slope the model visibly floats above or sinks into the ground. Users cannot trust where a model will actually sit relative to the real environment.

## Solution

Turn the basemap into a true 3D city view: real ground elevation (terrain relief) plus extruded 3D buildings with real heights. When a user drops a model or moves it, the model automatically snaps to the real ground height at that location, so it always sits correctly on the terrain — on slopes and flat ground alike.

3D buildings require building geometry data the current satellite tiles don't carry, so a MapTiler vector tile provider (with an API key) is added. Collision in this iteration means **ground snapping only** — models are not blocked from overlapping buildings or each other.

## User Stories

1. As an editor user, I want the map ground to show real elevation relief, so that the scene resembles the actual site.
2. As an editor user, I want to tilt and rotate the camera and see hills and slopes rendered correctly, so that I can judge the lay of the land.
3. As an editor user, I want 3D buildings rendered with their real heights, so that I understand the surrounding built environment.
4. As an editor user, I want buildings to appear over the satellite imagery rather than replacing it, so that I keep the photographic context.
5. As an editor user, I want buildings to appear only when I am zoomed in enough to be useful, so that the map stays readable when zoomed out.
6. As an editor user, when I drop a new model onto the map, I want it to land on the real ground at that spot, so that it doesn't float or sink.
7. As an editor user, when I move a model to a new location, I want it to re-settle onto the ground at the new spot, so that it stays grounded as I reposition it.
8. As an editor user, I want a model placed on a slope to follow the slope's height, so that placement looks physically plausible.
9. As an editor user, I want models to remain visually aligned with the rendered terrain as I pan and tilt, so that nothing drifts off the ground.
10. As an editor user, I want the auto-snap to happen without adding a confusing extra "undo" step, so that pressing undo right after placing a model simply removes the model.
11. As an editor user, I want placement to still work (model lands at sea level, then corrects) even if elevation data hasn't fully loaded yet, so that the editor never blocks or errors on me.
12. As a developer, I want the map provider key configured through the existing environment-variable validation flow, so that a missing key fails fast and clearly at boot.
13. As a developer, I want terrain and building config centralized in one place, so that source URLs, layer ids, and exaggeration are easy to find and change.
14. As a developer, I want the reducer/state layer to remain map-agnostic, so that the editor's data logic stays decoupled from MapLibre internals.
15. As a developer, I want elevation querying isolated behind a single hook, so that the async "tiles may not be loaded yet" concern lives in one testable place.

## Implementation Decisions

**Provider & config**
- Add `VITE_MAPTILER_KEY` to the env schema (Zod `envSchema`) and to the Vite env type declarations. Boot-time `checkEnv(envSchema)` enforces presence.
- A scope-local map-config module holds: MapTiler key, terrain-RGB DEM tiles URL, vector tiles URL, terrain exaggeration constant, and source/layer id constants.

**Terrain**
- Add a `raster-dem` source (MapTiler terrain-rgb-v2) with `encoding: 'mapbox'`.
- Enable terrain **imperatively** via `map.setTerrain({ source, exaggeration })` from a `null`-rendering controller component mounted inside the react-three-map `<Canvas>` (so it shares the live MapLibre `Map` via `useMap()`). Enable on `load` if style not ready; tear down with `setTerrain(null)`.
- `exaggeration` fixed at `1` so queried elevation equals rendered ground height (any other value would require scaling stored altitudes identically).

**Buildings**
- Add a MapTiler `vector` source and a `fill-extrusion` layer (`source-layer: 'building'`) drawn on top of the existing Esri satellite raster layers, `minzoom` 14, height from `render_height` / base from `render_min_height`. Satellite basemap is retained — no style switch.

**Ground snapping (the alignment model)**
- react-three-map anchors the Three.js scene via Mercator math that ignores terrain, so the scene anchor stays at sea level. Models align with rendered terrain because each object's stored `alt` carries its true elevation. `map.queryTerrainElevation(lngLat)` returns sea-level meters, matching the existing geo↔scene projection. The `<Canvas>` anchor altitude stays 0; the geo/scene projection utilities are unchanged.
- Snapping is **component-level** (needs the live map), never in the reducer.
- A `useGroundSnap()` hook returns `(lng, lat) => Promise<number>`. `queryTerrainElevation` returns `null` until DEM tiles decode, so the hook retries on the map `idle` event, caps retries (~10), and falls back to sea level (0).
- Snap is invoked: (a) once on model mount (placement) and (b) on transform `onMouseUp` (move), overriding the altitude before dispatching.

**State / history**
- Add a history-free `groundSnap` reducer action (`{ id, alt }`) that updates only `alt` without pushing to the undo stack, so auto-snap after placement doesn't create a phantom undo entry. The move flow keeps using the existing history-pushing `transform` action.

**Modules (build/modify)**
- *MapConfig* (new, deep-ish, pure constants): single source of truth for provider URLs/ids/exaggeration.
- *TerrainController* (new, shallow glue): owns terrain enable/disable lifecycle.
- *useGroundSnap* (new, deep, testable interface): hides async elevation-availability retry/fallback behind `(lng, lat) => Promise<number>`.
- *MapCanvas* (modify): register DEM + vector sources, buildings layer, mount TerrainController.
- *ObjectMesh* (modify): call snap on mount and on move.
- *EditorContext reducer* (modify): add history-free `groundSnap` action.
- *env schema + Vite env types* (modify): add the MapTiler key.

## Testing Decisions

This repository has **no test runner configured** (per CLAUDE.md) and the convention is not to add one unless explicitly requested. Therefore verification is **manual/end-to-end**, not automated unit tests.

A good test here verifies **external behavior**, not implementation details:
- The most valuable isolation target is `useGroundSnap`'s contract — *given* a map whose terrain returns null then a value, the promise resolves with the eventual elevation; *given* persistent null, it resolves to the fallback (0) after the retry cap. This is the deep module worth covering first **if** the team later adds a test runner.
- Pure config (MapConfig) needs no behavioral test.
- Glue components (TerrainController, MapCanvas wiring) are best validated by the manual procedure below rather than brittle render tests.

Manual verification procedure:
1. `npm run dev` (port 9777); open a patio over hilly terrain (e.g. San Francisco / an Alpine town).
2. Terrain: tilt via NavigationControl — ground shows relief; Network tab shows `terrain-rgb-v2` 200 responses.
3. Buildings: zoom ≥14 over a city — grey extrusions with varying heights; satellite still visible underneath.
4. Placement: drop a model — it settles on the ground on both slope and flat ground (no float/sink).
5. Move: translate a model up a hill and into a valley — on mouse-up it re-snaps to the new ground height.
6. Console: no repeating `queryTerrainElevation null` loop.
7. Undo immediately after placing — the object is removed cleanly with no phantom auto-snap undo step.
8. `npm run tsc` and `npm run lint` pass.

Edge cases to exercise: placing before DEM tiles finish loading (fallback then correction); moving into a freshly-panned, not-yet-decoded area; placing near the patio bounds edge (bounds clamping still applies to lng/lat, snapping only touches alt).

## Out of Scope

- **Building-overlap collision** — models are not blocked from intersecting buildings.
- **Model-to-model collision** — placed models may overlap each other.
- **Per-model footprint/dimension metadata** — snapping uses runtime bounding boxes only; no schema change to `Model3D` or `PlacedObject` beyond reusing existing `alt`.
- **Terrain exaggeration as a user control** — fixed at 1.
- **Switching basemap providers / removing Esri satellite.**
- **Adding a test runner / automated test suite.**
- **Offline or keyless building data** (OSM/Overture fallback was considered and declined in favor of MapTiler).

## Further Notes

- MapTiler free tier is ~100k tile requests/month, shared across DEM + vector + retained Esri raster. `queryTerrainElevation` reads already-loaded tiles and adds no network cost. Recommend restricting the key to the app origin in the MapTiler dashboard.
- Keep `exaggeration: 1`. If visual drama is later desired via higher exaggeration, stored altitudes must be scaled by the same factor or models will sink/float.
- The `encoding: 'mapbox'` setting on the DEM source is mandatory; wrong encoding yields black tiles and wrong elevations.
- Building height property names assume the openmaptiles schema (`render_height` / `render_min_height`); if buildings render flat, fall back to `height`.
