# Patio Editor Performance Rework — PRD

## Problem Statement

When a user opens the Patio Editor and interacts with the map (pan, zoom, orbit, place/transform objects), their machine heats up dramatically — an M1 Pro laptop reaches ~100°C and the fans spin to maximum. The page is unusable for extended sessions because the CPU and GPU are pinned even when the user is doing nothing. The editor "feels" heavy and drains battery.

The root cause is not a single bug but a stack of compounding issues that keep the render pipeline running at maximum frame rate continuously, and that re-render the entire React tree on every map frame.

## Solution

Rework the Patio Editor so that:

- The 3D scene only redraws when something actually changes (map movement or object transform), instead of repainting in an infinite loop forever.
- Map interaction (pan/zoom/orbit) no longer triggers a full-React-tree re-render on every frame.
- The map stops fetching and decoding tiles for a feature that is not used (terrain DEM).
- Selection outline stops running a permanent `requestAnimationFrame` loop at idle.
- Static configuration objects are not rebuilt on every render.

After the rework, an idle editor should consume near-zero CPU/GPU, and interaction should stay smooth without thermal runaway on an M1 Pro.

## User Stories

1. As a patio designer, I want the editor to sit idle without heating my laptop, so that I can leave it open while I think without the fans spinning.
2. As a patio designer, I want panning the map to stay smooth and cool, so that I can explore the site without lag or heat.
3. As a patio designer, I want zooming in/out to stay smooth and cool, so that I can frame my view comfortably.
4. As a patio designer, I want orbiting (changing pitch/bearing) to stay responsive, so that I can inspect objects from any angle.
5. As a patio designer, I want placing an object from the catalog to be instant, so that I do not wait on a stutter when adding furniture.
6. As a patio designer, I want dragging an object with the transform gizmo to stay smooth, so that positioning feels precise.
7. As a patio designer, I want rotating and scaling objects to redraw correctly, so that the on-screen result matches my input.
8. As a patio designer, I want the selection outline (bounding box) to track the selected object accurately, so that I always see what is selected.
9. As a patio designer, I want the selection outline to not waste battery when nothing is moving, so that an open selection does not drain my machine.
10. As a patio designer, I want the ViewCube to keep reflecting the live camera orientation, so that I always know which way I am facing.
11. As a patio designer, I want the satellite imagery, transport, and place labels to keep rendering, so that I retain the map context I rely on.
12. As a patio designer, I want the map to not waste bandwidth on unused terrain elevation tiles, so that the editor loads and runs leaner.
13. As a patio designer, I want autosave to keep working after the rework, so that my edits are still persisted.
14. As a patio designer, I want undo/redo to keep working after the rework, so that I can revert mistakes.
15. As a patio designer, I want the properties panel numeric inputs to keep editing the selected object, so that I can fine-tune transforms.
16. As a patio designer, I want model dimensions to keep displaying for the selected object, so that I can read real-world sizes.
17. As a maintainer, I want the map style config to be a stable static object, so that React does not re-diff a large literal on every render.
18. As a maintainer, I want the live camera position kept out of the global reducer, so that map movement does not invalidate editor state and undo history.
19. As a maintainer, I want dead terrain configuration removed, so that future readers are not misled by a "TerrainController slice" that does not exist.
20. As a maintainer, I want a documented way to profile interaction heat, so that we can decide later whether to drop antialiasing.

## Implementation Decisions

### Confirmed product/technical context (from grilling)

- The 3D scene is **static / interaction-only** — no autonomous animation (no animated GLTF, particles, live water). Therefore demand-based rendering is safe.
- **Antialias: keep for now, measure first.** Do not drop antialiasing in this pass; profile interaction after the other fixes and only revisit if still hot. (Note: `react-three-map` forces `antialias: true` internally, so disabling it later would require a workaround.)
- **Map layers:** terrain DEM is dead (declared source, never wired to `setTerrain`, no `TerrainController` exists) → **remove it**. Keep all three raster layers (satellite + transport + labels) — all product-required.
- **Context fix is minimal:** remove the live map center from the reducer entirely rather than restructuring contexts. A single editor context is acceptable because object transforms are user-paced, not per-frame.

### Modules to build / modify

- **Map render-loop config (deep change, highest impact).** Switch the `react-three-map` `<Canvas>` to `frameloop="demand"`. The library default (no prop) calls `map.triggerRepaint()` after every render, creating an infinite max-FPS repaint loop that runs forever even at idle. In demand mode the library wires R3F `invalidate()` to `map.triggerRepaint()`, so the scene redraws on map movement and on explicit invalidation only.

- **Static map style.** Hoist the entire `mapStyle` object (sources + layers) out of the component render into a module-level constant. The `MAPTILER_KEY` is interpolated at module load. Also hoist/memoize `maxBounds` and `initialViewState` derivations where they are stable. Goal: `<Map>` receives stable references and does not re-diff a large literal each render.

- **Editor camera state removal.** Delete `mapCenter` from the reducer state, delete the `setMapCenter` action, and delete the per-frame `onMove` dispatch in `MapCanvas`. The `'add'` action becomes pure-with-input: it receives the current center in its payload. The catalog reads `map.getCenter()` via `useMap()` (it sits under `MapProvider`) at click time and passes the center into the dispatch. Result: zero React state churn during map interaction.

- **Selection outline (BoxHelper).** Replace the permanent `requestAnimationFrame` update loop with an event-driven update: subscribe to the TransformControls `objectChange` event, call `helper.update()` plus R3F `invalidate()` on change, and update once on mount. No idle rAF.

- **ObjectsLayer model lookup.** Memoize the `modelId → model` `Map` with `useMemo` keyed on the models query data, instead of rebuilding it every render.

- **Dead terrain removal.** Remove the terrain-DEM source from the map style, and remove the now-unused terrain fields/ids from the map constants (and the misleading "TerrainController slice" comment).

### Optional follow-up (P2, may be deferred)

- **ViewCube isolation.** `useMapCamera` calls `setCamera` on every map `move`, re-rendering the whole ViewCube subtree per frame during interaction. Isolate the live transform into a small leaf component (or push via ref/CSS variable), and wrap `ZoomControl` in `React.memo`.
- **SelectionRaycaster.** Drop the unused `mode` dependency that re-registers the map click handler on every mode switch. Optionally raycast only the placed-object group instead of the entire scene (`scene.children`, recursive).

### Sequencing

1. `frameloop="demand"` (kills idle infinite repaint) — biggest single win.
2. Remove `mapCenter` per-frame dispatch (kills interaction re-render storm).
3. Hoist static `mapStyle`.
4. Replace BoxHelper rAF with event-driven update.
5. Remove dead terrain DEM.
6. Memoize `modelById`.
7. (Optional) P2 ViewCube + raycaster cleanups.

## Testing Decisions

This repository has **no test runner configured** (per `CLAUDE.md`), and the convention is not to introduce one unless explicitly requested. Therefore verification is manual + static analysis, not automated unit tests.

- **A good test here = observed external behavior**, not implementation details: does the editor stay cool at idle, does interaction stay smooth, do the features still work — not "is frameloop set to demand".
- **Static checks:** `npm run tsc` (one-shot type-check) and `npm run lint` must pass after the change.
- **Manual verification checklist (the real acceptance test):**
  - Open editor, leave idle → confirm CPU/GPU drops to near-zero (e.g. browser task manager / Activity Monitor shows no busy frame loop; no fan spin).
  - Pan / zoom / orbit → smooth, no thermal runaway; map repaints only while interacting.
  - Add object from catalog → places at current map center, instant.
  - Select object → outline appears and tracks correctly; deselect removes it.
  - Drag / rotate / scale via gizmo → scene redraws live and matches input.
  - Edit numeric fields in properties panel → object updates; model dimensions still display.
  - Undo / redo → still works; map movement does NOT create undo entries.
  - Autosave → still fires after edits (debounced) and shows saving/saved status.
  - ViewCube → still reflects live camera orientation; zoom %/home/fit still work.
  - Confirm in the network panel that terrain-RGB DEM tiles are no longer requested.
- **Profiling step (decides antialias):** after the above, profile interaction frame cost; only if still hot, open a follow-up to drop/override antialias.
- **Prior art:** none in-repo (no existing tests). If automated tests are wanted later, the pure reducer in `EditorContext` and the camera math utils are the natural unit-test seams (deep, pure, stable interfaces).

## Out of Scope

- Introducing a test runner or automated test suite.
- Dropping antialiasing (deferred to a measured follow-up).
- Restructuring the editor context into split/selector-based contexts (minimal `mapCenter` removal chosen instead).
- Adding real 3D terrain (the DEM is being removed, not wired up).
- Reducing the three raster layers to satellite-only (all kept).
- Level-of-detail / instancing for large numbers of placed objects.
- Replacing `react-three-map`, `react-map-gl`, or the GL stack.
- Visual/UX redesign of the editor panels.

## Further Notes

- Root-cause ranking by thermal impact: (1) `react-three-map` infinite repaint loop from missing `frameloop` prop — runs at max FPS forever, idle included; (2) per-frame `onMove` → reducer dispatch re-rendering the whole tree during interaction; (3) inline `mapStyle` literal re-diffed every render; (4) permanent BoxHelper `requestAnimationFrame` while an object is selected; (5) dead terrain DEM fetching/decoding; (6) `modelById` Map rebuilt every render.
- The `frameloop="demand"` fix interacts with the BoxHelper fix: in demand mode the outline must call `invalidate()` on transform change or it will not redraw. drei's `TransformControls` already calls `invalidate()` during gizmo drag, so gizmo movement redraws correctly; only the helper's own update needs wiring.
- Demand mode is safe specifically because the scene is static (confirmed). If autonomous animation is added later, this decision must be revisited (throttled `always` or targeted `invalidate` on the animation tick).
- Expected outcome: idle ≈ 0% busy frames; interaction cost bounded to actual movement frames; M1 Pro no longer thermally throttling.
