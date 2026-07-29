# Tracer: one model renders in view

## What to build

Thinnest end-to-end path: a single placed 3D model shows up in the read-only
Patio View. Seed one `PlacedObject` (reusing the existing Lantern catalog model)
on one fixture patio, and add a new **view-only** objects layer that reads
`patio.objects`, resolves the model's glTF URL, and renders it into the Cesium
scene using the existing `createObjectModel` + `geoPoseToModelMatrix`. Mount the
layer in Patio View inside the viewer provider. The model may pop in after the
reveal — gating comes later. No editor context, no gizmo, no selection, no pick
id, no silhouette.

## Acceptance criteria

- [ ] One fixture patio carries a single `PlacedObject` referencing the Lantern model
- [ ] Fixture input shape accepts optional `objects`, defaulting to `[]` when omitted
- [ ] Patios without objects behave exactly as before
- [ ] Opening the seeded patio renders the model seated at its authored pose (position/orientation/scale)
- [ ] The view-only layer has no dependency on editor context/gizmo/selection
- [ ] Models are non-interactive (no pick id, no silhouette)
- [ ] A minimal pure placement-plan function maps `modelId` → `gltfUrl` from the catalog
- [ ] Scene primitives are destroyed when the view unmounts (no leak on navigate away)
- [ ] Scene renders under `requestRenderMode` (a render is requested after the model loads)

## Blocked by

None - can start immediately.
