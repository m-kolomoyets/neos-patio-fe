## What to build

Restore the ViewCube navigation widget against the Cesium camera. The CSS cube and its interaction
code are kept; the camera read/write adapter is rewritten around a
`lookAt(target, HeadingPitchRange)` model where the target is the patio bounds center sampled to
ground height. The cube mirrors orientation, snaps to faces, orbits on drag, and zoom presets +
custom home view work.

End-to-end:
- `useCameraState` reads `camera.heading` / `pitch` and derives range from camera position ↔ target
  on `camera.changed`; only the leaf re-renders per frame.
- Camera writers (`useMapCamera` equivalent) become `camera.flyTo` / `lookAt`.
- Camera math: cube transform keeps heading→`rotateZ`, pitch→`rotateX`; snap and orbit emit
  `HeadingPitchRange`; `roll` locked to 0.
- Zoom %: redefined as a function of camera range (100% = a reference range); `LiveZoomControl` UI
  unchanged.
- Home view stores `{ heading, pitch, range }` in localStorage (same pattern as today).
- Camera writes fire `scene.requestRender()`.

## Acceptance criteria

- [ ] ViewCube mirrors the live camera heading/pitch
- [ ] Clicking a cube face snaps the camera to that orientation (animated)
- [ ] Dragging the cube orbits the camera around the bounds-center target
- [ ] Zoom presets and the live zoom % work against camera range
- [ ] Save / return-to home view works and persists in localStorage
- [ ] `roll` stays 0; CSS cube + interaction code unchanged
- [ ] Camera writes trigger renders under `requestRenderMode`
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #plans/cesium-map-migration/s1-photorealistic-viewer.issue.md
