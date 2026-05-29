# Single Patio Editor — 3D Map with Manipulable 3D Objects

## Problem Statement

A user browsing the patio library can click a card and lands on `/patios/$id`, but the page is a stub ("coming soon"). The user has no way to view a patio in 3D, no way to compose it by placing 3D models on a real-world location, and no way to manipulate those models (move, rotate, scale) directly in the scene. There is no persistence of object placements either.

The user needs a dedicated editor for a single patio: a 3D view of a real piece of earth, bounded to that patio's geographic area, on which they can add 3D models from a catalog, move them around the map, rotate and scale them with a gizmo, and have their work autosave.

## Solution

A new `/patios/$id` page rendered by a `PatioEditor` module. The view is a full-bleed 3D MapLibre map whose camera and pan are hard-clamped to the patio's bounds and centered on mount. A three.js scene is mounted as a MapLibre custom layer (via `react-three-map`), sharing MapLibre's camera matrix every frame so that 3D objects stay geo-anchored as the user pans, zooms, and tilts.

The user opens a catalog panel listing available 3D models (GLTF assets). Clicking a catalog item drops the model at the map center. Clicking an object in the scene selects it and shows a gizmo (drei `<TransformControls>`). A toolbar switches gizmo mode between translate (XY along the ground), rotate (yaw only, around the vertical axis), and scale (uniform). A properties panel shows the selected object's lng/lat/altitude, yaw degrees, and scale, with delete control. Bounds are enforced for objects too: dragging an object outside the patio polygon clamps it to the edge.

Object state is canonical in geographic coordinates (lng/lat/alt + yaw + scale) and autosaves to a stub backend after a short debounce. An undo/redo stack lets the user reverse mistakes.

## User Stories

1. As a patio designer, I want clicking a library card to take me into a full editor for that patio, so that I can start composing it immediately.
2. As a patio designer, I want the editor to open centered on the patio's real-world location, so that I have spatial context from the first frame.
3. As a patio designer, I want the camera locked to the patio's bounding area, so that I cannot accidentally pan away into unrelated terrain.
4. As a patio designer, I want to tilt and rotate the camera in 3D, so that I can inspect placements from multiple angles.
5. As a patio designer, I want a catalog of available 3D models, so that I can browse what I can place.
6. As a patio designer, I want clicking a catalog item to add that model to the scene, so that placement is one click.
7. As a patio designer, I want newly added models to appear at the visible center of the map, so that I can immediately see what I just added.
8. As a patio designer, I want to click an object in the scene to select it, so that I can manipulate it.
9. As a patio designer, I want a visible gizmo on the selected object, so that I know it is selected and what affordances are available.
10. As a patio designer, I want to drag the translate gizmo to move an object along the ground plane, so that I can position it on the map.
11. As a patio designer, I want to rotate the selected object around its vertical axis with the gizmo, so that I can orient it correctly.
12. As a patio designer, I want to scale the selected object uniformly with the gizmo, so that I can adjust size to fit the scene.
13. As a patio designer, I want to switch gizmo mode (translate / rotate / scale) from a toolbar, so that I do not have to memorize keyboard shortcuts.
14. As a patio designer, I want the map's drag-pan to disable while I am dragging a gizmo, so that I do not move the camera by accident.
15. As a patio designer, I want objects to remain anchored to their real-world coordinates as I pan, zoom, and tilt, so that they behave like real geo-located features.
16. As a patio designer, I want to delete a selected object, so that I can remove mistakes.
17. As a patio designer, I want a properties panel showing the selected object's lng / lat / altitude / yaw / scale, so that I can verify or fine-tune values numerically.
18. As a patio designer, I want object placement to be clamped to the patio's bounds, so that I cannot accidentally drop objects outside the buildable area.
19. As a patio designer, I want dragging an object past the bounds to snap it to the nearest edge, so that the interaction stays predictable.
20. As a patio designer, I want my edits to autosave shortly after I stop interacting, so that I do not lose work and do not need to remember to press save.
21. As a patio designer, I want a visible "Saving…" / "Saved" indicator, so that I trust my work is persisted.
22. As a patio designer, I want to undo my last action, so that I can recover from mistakes.
23. As a patio designer, I want to redo an action I undid, so that I can re-apply a change I just reverted.
24. As a patio designer, I want clicking empty map to deselect, so that the gizmo and properties panel reset cleanly.
25. As a patio designer, I want the editor to fetch the patio's existing object set on load, so that previously placed objects appear immediately.
26. As a patio designer, I want object identity to be stable across saves, so that selection and undo history do not break after autosave.
27. As a developer, I want geographic-to-scene math isolated in a pure module, so that I can reason about coordinate transforms without booting MapLibre.
28. As a developer, I want bounds-clamping isolated in a pure module, so that the same logic applies to drop-on-add and to gizmo-drag.
29. As a developer, I want undo/redo handled as a pure history utility, so that it composes with the editor reducer without leaking into UI code.
30. As a developer, I want the model catalog backed by its own service, so that we can later replace the mock with a real asset backend without touching the editor.

## Implementation Decisions

### New route behavior

- Existing `src/routes/patios.$id.tsx` keeps its `noopReturnNull` component but gains a `loader` that prefetches the patio detail via the existing `getPatioQueryOptions(id)` factory.
- The lazy half (`patios.$id.lazy.tsx`) replaces the placeholder with a single render of the new `PatioEditor` module.

### New module — `PatioEditor`

The module owns the editor shell (full-bleed map + floating panels) and takes no props per repo convention. Internally it composes the following modules.

### Modules

**EditorContext (state core).** Provides a React context + reducer with state shape: `objects: PlacedObject[]`, `selectedId: string | null`, `mode: 'translate' | 'rotate' | 'scale'`, history stacks. Actions: `add`, `remove`, `transform`, `select`, `setMode`, `undo`, `redo`. Reducer is pure and consumes the bounds-clamp and history utilities so that every mutating action passes through both.

**GeoSceneProjection (deep, pure).** Encapsulates `lngLatAlt → THREE.Vector3` and inverse, computed against MapLibre's `MercatorCoordinate` and its meter-scale factor. Single home for all coordinate math. Interface: two functions. This is the module most likely to have subtle bugs and the one most worth keeping pure.

**BoundsClamp (deep, pure).** Given the patio bounds (bbox or polygon) and a candidate `{ lng, lat }`, returns a clamped `{ lng, lat }` snapped to the nearest in-bounds point. Used both by `add` (drop at center if center is out of bounds, snap) and by `transform` (gizmo drag clamping). Interface: one function.

**UndoRedoHistory (deep, pure).** Generic stack utility: `push(prev)`, `undo(current)`, `redo(current)`, with a configurable cap (default 50). Editor reducer instantiates one for the editor state. Interface: `{ push, undo, redo, canUndo, canRedo }`.

**MapCanvas (shell).** Initializes the MapLibre instance, applies `setMaxBounds(patio.bounds)`, fits view to the bounds' center on mount, and mounts the `react-three-map` `<Canvas>` overlay so that the three scene renders inside a MapLibre custom layer with synced camera matrix.

**ObjectsLayer.** Reads `objects` from EditorContext and renders one `<ObjectMesh>` per entry. Each mesh loads its GLTF via drei `useGLTF`, positions itself via GeoSceneProjection, and dispatches `select(id)` on click.

**Gizmo.** Binds drei `<TransformControls>` to the currently-selected mesh ref. Reads `mode` from context. On change, reads the mesh transform, inverts through GeoSceneProjection to lng/lat/alt + yaw + scale, runs BoundsClamp, and dispatches `transform(id, next)`. While the gizmo is being dragged, the MapLibre instance's interactions are disabled so the map does not pan along with the gesture.

**CatalogPanel.** Lists models from a new `useModelsQuery` hook. Clicking an item dispatches `add` with the current map center (clamped) as the geo position.

**PropertiesPanel.** Shows numeric controls (Base UI inputs) for the selected object's lng / lat / alt / yaw / scale. Edits dispatch `transform`. Includes a delete button dispatching `remove`.

**Toolbar.** Mode switcher (translate / rotate / scale), undo, redo, and autosave status indicator.

**useAutosavePatio.** Wraps a `useMutation` driven by `updatePatioObjectsMutationOptions(id)`. Watches `objects` from EditorContext, debounces by ~600ms, fires the mutation, surfaces `idle` / `saving` / `saved` for the toolbar.

### Service changes

- `src/services/patios/types.ts` gains `bounds` (bbox or GeoJSON polygon) and `objects: PlacedObject[]` on the `Patio` type. New `PlacedObject` type with `{ id, modelId, lng, lat, alt, yawRad, scale }`.
- `src/services/patios/api.ts` gains a stub `updatePatioObjects(id, objects)` (200ms delay, in-memory mutation matching the existing mock pattern).
- `src/services/patios/queries.ts` gains `updatePatioObjectsMutationOptions(id)`, which invalidates `patiosKeys.detail(id)` on success.
- New service `src/services/models/` with `Model3D` type (`id`, `name`, `gltfUrl`, `previewUrl`), mock `api.ts`, `queryKeys.ts`, and `queries.ts` exposing `getModelsQueryOptions` / `useModelsQuery`.

### Dependencies

`maplibre-gl`, `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, `react-three-map`. Install via the project's `npm-audit-install` workflow.

### Coordinate model

Geographic (lng / lat / alt) is canonical and the only thing persisted. Local meters and three.js world units exist only inside a render frame, derived through `GeoSceneProjection`. The editor reducer never sees scene-space numbers.

### Interaction contract

- Selection: click on a mesh selects; click on empty map deselects.
- Gizmo modes: translate constrained to ground plane (XY), rotate constrained to yaw (Y axis), scale uniform.
- Bounds: camera hard-clamped via MapLibre `maxBounds`; objects clamped in the reducer on every `add` and `transform`.
- Autosave: every mutating action restarts a debounce; one PATCH per quiet period.
- Undo/redo: every mutating action pushes the prior state; undo/redo pop between stacks.

## Testing Decisions

The repository has no test runner configured, and `CLAUDE.md` is explicit that none should be added unless asked. The user has confirmed they want to match repo convention and skip automated tests for this PRD.

A good test in this codebase, if one were to be added later, would target only the externally observable behavior of a module — e.g. `GeoSceneProjection` given a known MapLibre center returns a `Vector3` that round-trips back to the same lng/lat within float epsilon — without coupling to internal field names or call order.

Verification for this work is manual, captured in the implementation plan: `npm run dev`, navigate to a patio, exercise the full add / select / gizmo / undo / autosave flow, tilt and zoom to confirm geo-anchoring holds, drag past the bounds to confirm clamping, reload to confirm persistence. `npm run tsc` and `npm run lint` must pass clean.

Modules designed as deep + pure (`GeoSceneProjection`, `BoundsClamp`, `UndoRedoHistory`, the editor reducer) are structured so they could be tested in isolation if a runner is introduced later, without rework.

## Out of Scope

- Test runner setup and any automated tests.
- Real backend for patios or models (both remain mocks; only the seams are added).
- User-uploaded GLTF assets — catalog only.
- Full 3-axis rotation (pitch/roll) and per-axis scale — only yaw + uniform scale.
- Multi-select, copy/paste, alignment helpers, snapping to other objects.
- Collaborative editing, presence, cursors.
- Camera bookmarks, screenshots, export, sharing.
- Mobile/touch optimization beyond what MapLibre + drei provide by default.
- Soft / warning bounds — bounds are hard, no overflow allowed.
- Authorization checks on who can edit which patio.

## Further Notes

- The single architectural decision worth restating: **React state holds geo coords; three.js objects are a derived view.** Every gizmo gesture round-trips through `GeoSceneProjection` and `BoundsClamp` back to geo before re-rendering. This is what keeps the map and the 3D objects in sync without drift.
- `react-three-map` is the preferred adapter for ergonomic gizmo wiring via drei `<TransformControls>`. The fallback, if that package proves unsuitable at install time, is a hand-written MapLibre custom layer driving a raw three.js scene + a manually instantiated `TransformControls` — same data flow, more boilerplate, no change to module boundaries.
- The mock `updatePatioObjects` should keep object identity (ids) stable so that selection and undo history remain valid across autosaves.
- `useGLTF.preload` should be called on catalog item hover to mask load latency at placement time.
