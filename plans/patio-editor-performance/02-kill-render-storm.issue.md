## What to build

Stop the full-React-tree re-render on every map frame during pan/zoom/orbit.

Two coupled changes on the same per-frame render path:

1. **Drop `mapCenter` from the editor reducer.** Today `onMove` dispatches `setMapCenter` ~60fps → new reducer state → new context value → every `useEditorState` consumer re-renders every frame. `mapCenter` is consumed only by the `'add'` action. Remove the `mapCenter` state field, the `setMapCenter` action, and the per-frame `onMove` dispatch. Make `'add'` receive the current center in its payload; the catalog reads `map.getCenter()` via `useMap()` (it sits under `MapProvider`) at click time and passes it in.

2. **Memoize `modelById`** in `ObjectsLayer` with `useMemo` keyed on the models query data, instead of rebuilding the `Map` every render.

## Acceptance criteria

- [ ] `mapCenter` state, `setMapCenter` action, and the `onMove` dispatch are removed.
- [ ] Panning/zooming/orbiting the map triggers no editor-context re-renders (verify with React DevTools profiler — ObjectsLayer/ObjectMesh/Toolbar/PropertiesPanel do not re-render during map movement).
- [ ] Adding an object from the catalog still places it at the current map center.
- [ ] `modelById` is rebuilt only when models data changes.
- [ ] Undo/redo unaffected; map movement creates no undo entries.
- [ ] Autosave still fires on edits.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
