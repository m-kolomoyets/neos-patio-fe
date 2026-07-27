# PRD — 3D Models in Patio View

## Problem Statement

When a visitor opens a patio in the read-only Patio View, they see the framed
real-world location (Google Photorealistic 3D Tiles) orbiting on the map — but
none of the 3D models that make a patio a *patio*. The placed objects that give
a patio its identity are only ever rendered in the editor. A published patio
therefore looks empty to anyone viewing it, and the fixture data that should
describe those objects is stubbed out (`objects: []`) for every patio.

## Solution

Render a patio's placed 3D models in the read-only Patio View, seated on the
world surface inside the patio bounds, exactly where they were authored. Extend
the fixture data so real patios carry real objects (mixed models, poses, scale),
and load several models efficiently in a single concurrent batch so the scene
appears complete before the loading overlay clears. The view is purely
presentational — models are decoration, not interactive.

## User Stories

1. As a patio visitor, I want to see the 3D models placed in a patio when I open
   its view, so that I experience the patio as its author designed it.
2. As a patio visitor, I want each model to sit on the ground at the correct
   spot, so that the scene reads as a real place and not floating clutter.
3. As a patio visitor, I want models to appear at the correct orientation and
   size, so that the composition matches the author's intent.
4. As a patio visitor, I want a patio with several different models to render all
   of them, so that rich patios are shown in full.
5. As a patio visitor, I want the scene to be complete the moment the loading
   overlay clears, so that I never see models pop in after the reveal.
6. As a patio visitor, I want the view to still reveal promptly even if a model
   asset fails to load, so that one broken asset never leaves me stuck on a
   loading screen.
7. As a patio visitor, I want a patio with no objects to behave exactly as it
   does today, so that empty patios are unaffected.
8. As a patio visitor viewing on mobile, I want models to render within the same
   framed, orbit-constrained map, so that the experience is consistent with
   desktop.
9. As a developer, I want the placed-object data to live in the existing
   fixtures with real poses, so that I can develop and demo the view against
   representative data.
10. As a developer, I want a small catalog of distinct sample models, so that
    multi-model rendering and batching are actually exercised.
11. As a developer, I want a warning in development when a fixture object falls
    outside its patio bounds, so that I can catch mis-authored data early.
12. As a developer, I want the read-only rendering path to be independent of the
    editor's selection/gizmo/context, so that the view stays lean and the two
    paths evolve independently.
13. As a developer, I want models loaded concurrently with same-URL fetches
    deduped, so that patios with repeated or multiple models load efficiently.
14. As a developer, I want the editor's reveal/ready behavior unchanged, so that
    adding view-object loading does not regress the editor.
15. As a developer, I want the object placement math reused from the existing
    geo-placement utilities, so that view and editor seat models identically.
16. As a developer, I want scene primitives torn down when the view unmounts, so
    that navigating away does not leak Cesium models.
17. As a maintainer, I want the load-planning logic (dedupe, model resolution,
    bounds check) isolated in a pure function, so that it is verifiable without a
    running Cesium scene.

## Implementation Decisions

### Data — model catalog
- Extend the models catalog fixtures with 2–3 additional Khronos glTF sample
  assets (e.g. Duck, Avocado, BoxTextured) alongside the existing Lantern, using
  the current `buildAsset` helper. Objects reference a mix so distinct-model
  concurrent loading is exercised.

### Data — patio fixtures
- The `Patio` type already carries `objects: PlacedObject[]`; `PlacedObject`
  already models `{ modelId, lng, lat, height, heading, pitch, roll, scale }`.
  No type changes to these.
- Extend the fixture input shape to accept optional `objects`, defaulting to `[]`
  when omitted (preserving current behavior for un-seeded patios).
- Seed a few patios (e.g. Mont Saint Michel, Colosseo) with several objects each:
  mixed `modelId`s, lng/lat inside the patio `bounds`, authored HPR + scale.
- **Height semantics: trust absolute.** `PlacedObject.height` remains absolute
  WGS84 altitude, rendered as authored — matching editor semantics and the type
  contract. No surface sampling at runtime. (See risk in Further Notes.)

### Rendering — new view-only objects layer
- A new read-only objects layer under Patio View, independent of the editor:
  no `EditorContext`, no transform gizmo, no selection.
- Reuses the existing `createObjectModel` primitive owner and
  `geoPoseToModelMatrix` placement math so view and editor seat models
  identically.
- **Non-interactive:** models carry no pick id and no silhouette. Pure
  decoration.
- Reads the patio's `objects` via prop; renders nothing to the DOM beyond what
  the scene needs.
- Tears down all created primitives on unmount.

### Rendering — batch load
- Fire all `Model.fromGltfAsync` calls concurrently (`Promise.all`-style),
  relying on Cesium's `ResourceCache` to dedupe same-URL fetches automatically.
- Request a single scene render once the batch settles (respecting
  `requestRenderMode`), rather than one render per model.
- The batch **settles on both success and failure/timeout** for each model, so a
  dead asset URL can never stall completion.

### Bounds
- Trust fixture authoring (the editor already clamps on placement). The view does
  not clamp or drop objects. In development only, emit a `console.warn` if an
  object's lng/lat lies outside the patio bounds. (Reuse the existing bounds
  representation `[west, south, east, north]`.)

### Reveal gate — Patio View orchestrates
- The new objects layer exposes an `onLoaded` signal fired when the batch settles
  (or immediately when there are no objects).
- The shared `CesiumMap` continues to flag scene-ready on tileset settle, but in
  view mode it no longer clears the page-transition overlay itself; that
  responsibility moves to Patio View.
- Patio View clears the overlay / reveals only when **both** map-ready and
  objects-loaded are true. Empty `objects` reveals on map-ready as today.
- **Editor path is unchanged:** `CesiumMap` keeps owning the reveal for the
  editor route.
- A safety timeout guarantees the reveal fires even if the objects-loaded signal
  never arrives.

### Module boundaries (deep modules)
- **Placement plan (pure):** object list → resolved load plan — map each
  `modelId` to its `gltfUrl`, dedupe URLs, and flag out-of-bounds objects. No
  Cesium dependency; verifiable in isolation.
- **Batch loader:** takes the plan + scene, drives concurrent
  `Model.fromGltfAsync`, settles on error/timeout, reports loaded count / done.
- **View objects layer:** thin React shell wiring the plan + loader into the
  scene and surfacing `onLoaded`.
- **Reveal-gate glue:** Patio View combines map-ready + objects-loaded to reveal.

## Testing Decisions

**Repo reality:** no test runner is configured, and adding one is out of scope
for this PRD. This section documents *what should be tested* as intent, so the
modules are built test-ready (pure, side-effect-free where possible), and so
tests can be added later without rework.

- **What makes a good test here:** assert external behavior, not implementation.
  For the placement-plan module: given objects + catalog + bounds, assert the
  returned plan (resolved URLs, dedupe result, out-of-bounds flags) — never how
  it iterates.
- **Placement plan (pure)** — primary test target when a runner exists:
  - Resolves each `modelId` to the correct `gltfUrl`.
  - Dedupes repeated URLs so the same asset is planned once.
  - Flags objects whose lng/lat fall outside `[west, south, east, north]`,
    including on-edge cases.
  - Handles an empty object list.
  - Handles an unknown `modelId` (object with no matching catalog entry).
- **Batch loader** — behavioral tests with a mocked loader:
  - Settles as done after all models resolve.
  - Settles as done even when one/all loads reject.
  - Settles via timeout if a load never resolves.
  - Reports the correct loaded/failed counts.
- Manual verification in-app: open a seeded patio, confirm models render seated,
  oriented, scaled; confirm reveal waits for models; confirm a deliberately
  broken URL still reveals; confirm an empty patio is unchanged; confirm editor
  reveal is unchanged.

## Out of Scope

- Adding a test runner or writing executable tests.
- GPU instancing via `ModelInstanceCollection` (revisit only if a patio carries
  many instances of one model).
- Runtime surface-height sampling / re-seating; heights are trusted as authored.
- Any interactivity on view models (click, hover, select, info popups, highlight).
- Editing, adding, or removing objects from the view.
- Backend/API changes; all data remains fixture/mock-driven.
- Real (non-sample) production model assets and correct real-world absolute
  altitudes for the seeded patios.
- Level-of-detail, culling, or performance tuning beyond concurrent load + cache
  dedupe.

## Further Notes

- **Absolute-height authoring risk (accepted):** with the "trust absolute height"
  decision, hand-authored WGS84 altitudes in fixtures will float or sink models
  relative to the Google tileset surface. Recommended mitigation: derive correct
  heights once by placing each object in the editor and reading back its resolved
  pose, then paste those values into the fixtures. Runtime surface sampling was
  explicitly rejected to keep the type's absolute-height semantics intact.
- Existing reusable pieces: `createObjectModel`, `geoPoseToModelMatrix`,
  `clampToBounds`, `sampleSurfaceHeight` (available but unused per the height
  decision), the `PlacedObject` / `Patio.objects` types, and `useModelsQuery`.
- The world tileset and camera/orbit behavior are untouched; models are added as
  additional scene primitives on top of the existing framed view.
