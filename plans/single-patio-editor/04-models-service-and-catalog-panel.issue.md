## What to build

Create a new `src/services/models/` service exposing a catalog of 3D models. Mock backend matching the existing patio service pattern (200ms delay, in-memory list). Each `Model3D` has `{ id, name, gltfUrl, previewUrl }`. Use real public-domain GLTF URLs (e.g. KhronosGroup sample-models CDN) so meshes actually load in the next slice. Add a `CatalogPanel` component inside `PatioEditor` that renders the list with thumbnails + names. No add-to-scene behavior yet (added in slice 5).

## Acceptance criteria

- [ ] `src/services/models/` contains `api.ts`, `types.ts`, `queryKeys.ts`, `queries.ts`
- [ ] `Model3D` type with `{ id, name, gltfUrl, previewUrl }`
- [ ] `listModels()` mock returns ≥ 3 entries with real GLTF URLs
- [ ] `getModelsQueryOptions()` factory exists; `useModelsQuery()` hook wraps it
- [ ] `src/modules/PatioEditor/components/CatalogPanel/` renders the list with thumbnails and names
- [ ] Panel is visible in the editor layout (floating left)
- [ ] `npm run tsc` and `npm run lint` clean

## Blocked by

- Blocked by `01-patio-types-and-route-shell.issue.md`
