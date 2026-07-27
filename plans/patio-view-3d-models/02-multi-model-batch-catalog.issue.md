# Multi-model concurrent batch + catalog

## What to build

Extend to several models per patio, loaded efficiently. Add 2–3 distinct Khronos
glTF sample models to the catalog fixtures (alongside Lantern) via the existing
asset helper. Seed a few fixture patios with several objects each, mixing
`modelId`s. Introduce a batch loader that fires all `Model.fromGltfAsync` calls
concurrently, relies on Cesium's `ResourceCache` to dedupe same-URL fetches, and
requests a single scene render once the batch settles (instead of one render per
model). Extend the placement plan to dedupe URLs across the object list.

## Acceptance criteria

- [ ] Catalog fixtures include 2–3 additional distinct sample models plus Lantern
- [ ] A few patios are seeded with several objects each, referencing mixed models
- [ ] All objects for a patio load concurrently, not sequentially
- [ ] Repeated same-URL models are fetched once (cache dedupe verified)
- [ ] A single render is requested once the batch settles
- [ ] Placement plan returns a deduped load plan (URL resolved once per unique asset)
- [ ] A patio with multiple distinct models renders all of them seated correctly

## Blocked by

- Blocked by #01-tracer-one-model-renders
