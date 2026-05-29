## What to build

Create `EditorContext` — a React context + pure reducer holding `{ objects, selectedId, mode }`. Implement the `add` action. Wire `CatalogPanel` clicks to dispatch `add` with the current map center as the geo position (selecting a sensible default `alt`, `yawRad: 0`, `scale: 1`). Create `ObjectsLayer` inside the r3f Canvas that renders one `<ObjectMesh>` per object, loading GLTF via drei `useGLTF` and positioning via `GeoSceneProjection`. Remove the sentinel cube from slice 3.

## Acceptance criteria

- [ ] `src/modules/PatioEditor/context/EditorContext.tsx` provides reducer + hooks (`useEditorState`, `useEditorDispatch`)
- [ ] Reducer is pure; `add` appends a new `PlacedObject` with a stable id (e.g. `crypto.randomUUID()`)
- [ ] `CatalogPanel` item click dispatches `add` with `{ modelId, lng, lat }` from map center
- [ ] `ObjectsLayer` renders one mesh per `objects[]` entry
- [ ] Each mesh loads the model's `gltfUrl` via `useGLTF` and positions via `geoToScene`
- [ ] `useGLTF.preload(url)` called on catalog item hover
- [ ] Sentinel cube removed
- [ ] Clicking three catalog items places three meshes; meshes stay geo-anchored on pan/zoom
- [ ] `npm run tsc` and `npm run lint` clean

## Blocked by

- Blocked by `03-three-overlay-and-geo-scene-projection.issue.md`
- Blocked by `04-models-service-and-catalog-panel.issue.md`
