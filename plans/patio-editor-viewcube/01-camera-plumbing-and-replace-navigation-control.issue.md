## What to build

The infrastructure spine the rest of the ViewCube work builds on. Lift the maplibre `Map` instance so a screen-fixed overlay can read and write camera state (bearing/pitch/zoom/center), remove the default maplibre `NavigationControl`, raise `maxPitch` to 85°, and drop an empty custom widget shell into the bottom-right corner.

Camera state must **not** enter the `EditorContext` reducer / undo history — it stays as ephemeral viewport state read from the map. The widget reads `{ bearing, pitch, zoom }` from the `Map` instance (subscribing to its `move`/`rotate`/`pitch` events into local component state) and writes back via `map.easeTo` / `setBearing` / `setPitch` / `setZoom`.

The shell renders nothing functional yet — it just establishes placement, z-index, and the camera read/write wiring that issues #2–#5 consume.

## Acceptance criteria

- [ ] The maplibre `Map` ref is accessible to a screen-fixed overlay widget (ref lifted in `MapCanvas` and passed down, or the widget rendered as a `<Map>` DOM child so `useMap()` reaches it).
- [ ] A new `ViewCube/` widget shell renders bottom-right, above the canvas and below any modal/dialog, clear of the top-right Properties panel and top-center Toolbar.
- [ ] The shell reads live `{ bearing, pitch, zoom }` from the map via `move`/`rotate`/`pitch` event subscriptions into local state (no `EditorContext` reducer changes; nothing added to undo/redo).
- [ ] The default maplibre `NavigationControl` is removed.
- [ ] `maxPitch` is raised to 85° in the map config; map can be tilted to 85° by drag.
- [ ] Folder follows the `index.tsx` + `styles.module.css` anatomy; camera target table stubbed in `constants.ts`, camera math helpers stubbed in local `utils/`.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- None - can start immediately.
