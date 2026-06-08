## What to build

Restore catalog placement as native Cesium models that sit correctly on the real ground surface and
persist. Clicking a catalog model adds it at the center of the current view, dropped onto the
photorealistic tileset surface, clamped to the patio bounds, and autosaved.

End-to-end:
- A `geoPlacement` module: geographic↔`modelMatrix` (ENU + HPR via
  `Transforms.headingPitchRollToFixedFrame`), surface-height sampling (`scene.pickPosition` for
  one-shot spawn at viewport center; `sampleHeightMostDetailed` for re-grounding), and a geographic
  rectangle bounds clamp on `lng`/`lat` against `[west, south, east, north]`.
- `EditorContext` refactored to store the new persisted format `{ lng, lat, height, heading, pitch,
  roll, scale }` (geographic + HPR). The old scene-Cartesian + Euler format and the Mercator
  projection utility are removed. Every mutation fires `scene.requestRender()`.
- `ObjectsLayer` / `ObjectModel` load each object via `Model.fromGltfAsync` (KhronosGroup Lantern
  mock remains the catalog content) and build its `modelMatrix` from stored geographic + HPR.
- Catalog add: spawn at viewport-center via `pickPosition`, resolve absolute height, clamp to bounds,
  dispatch `add`.
- Autosave persists the geographic format.

## Acceptance criteria

- [ ] `geoPlacement` converts geographic + HPR ↔ `modelMatrix` correctly (visual round-trip)
- [ ] Clicking a catalog model adds it at the visible viewport center, not behind a panel
- [ ] A newly placed object rests on the real tileset surface (no float/sink)
- [ ] Objects are clamped within the patio bounds on spawn
- [ ] Placed objects render as `Model.fromGltfAsync` instances and are occluded correctly by world geometry
- [ ] `EditorContext` stores `{ lng, lat, height, heading, pitch, roll, scale }`; old projection util deleted
- [ ] Autosave persists and reloads objects in the new format
- [ ] Each mutation triggers a render under `requestRenderMode`
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #plans/cesium-map-migration/s1-photorealistic-viewer.issue.md
