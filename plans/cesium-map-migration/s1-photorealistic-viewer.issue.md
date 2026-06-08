## What to build

Replace the MapLibre render core with a Cesium scene streaming Google Photorealistic 3D Tiles.
When a patio opens, the editor shows a photorealistic 3D view of that exact real-world location,
framed on the patio bounds, with data attributions visible.

End-to-end:
- A `CesiumViewerProvider` creates the `Viewer` once (imperatively, in an effect against a container
  ref), holds it in context, and exposes `useCesiumViewer()` (single-instance shape mirroring the old
  `useMap()` / `EDITOR_MAP_ID` registry). Viewer config: `requestRenderMode = true`,
  `globe.show = false`, default Cesium widgets (timeline/animation/baseLayerPicker/geocoder/etc.)
  disabled, credit container kept mounted and visible.
- A sceneBootstrap step loads Google Photorealistic 3D Tiles via `createGooglePhotorealistic3DTileset`
  using `VITE_GOOGLE_MAPS_API_KEY`, sets `showCreditsOnScreen = true`, and sets
  `Cesium.Ion.defaultAccessToken` from `VITE_CESIUM_ACCESS_TOKEN` at boot.
- Initial framing: after the first tiles load, `camera.flyTo` a `Rectangle.fromDegrees(west, south,
  east, north)` from the patio bounds with `heading = 0`, `pitch = -45°`; seed this as the home view.

This slice rips out the MapLibre map and (necessarily) the `react-three-map` Three.js overlay, since
the overlay is bound to the MapLibre map. Placed objects and the ViewCube are temporarily absent and
restored in S2 / S6. Dependency packages are NOT removed yet (that is S8) — only their usage in the
render path is replaced.

Runtime rendering requires the Google **Map Tiles API** enabled on the key (external ops task,
flagged in the PRD). Build/type/lint verification does not depend on it.

## Acceptance criteria

- [ ] `CesiumViewerProvider` creates a single `Viewer`, exposes `useCesiumViewer()`, and tears down cleanly on unmount
- [ ] Viewer runs with `requestRenderMode = true`, `globe.show = false`, default widgets off
- [ ] Google Photorealistic 3D Tiles load and render for the open patio's coordinates (with Map Tiles API enabled)
- [ ] Credit container is visible and shows the tileset's data attributions
- [ ] `Cesium.Ion.defaultAccessToken` set at boot; no ion demo-token warnings
- [ ] On open, the camera frames the patio bounds rectangle at heading 0 / pitch -45°, seeded as home view
- [ ] MapLibre base map, extruded buildings, and the `react-three-map` overlay are no longer in the render path
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #plans/cesium-map-migration/s0-build-cesium-foundation.issue.md
