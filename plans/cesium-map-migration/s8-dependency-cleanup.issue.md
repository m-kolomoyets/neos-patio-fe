## What to build

Remove the now-unused MapLibre and Three.js dependency surface once every capability has been
re-implemented on Cesium, shrinking the bundle and dependency footprint.

End-to-end:
- Confirm no remaining imports of `maplibre-gl`, `react-map-gl`, `react-three-map`, `three`,
  `@react-three/fiber`, `@react-three/drei`, `@types/three` anywhere in `src` (all were confined to
  the PatioEditor module).
- Remove those packages from `package.json` and refresh the lockfile.
- Keep `cesium`; ensure `vite-plugin-cesium` remains.
- Verify the production build and bundle visualizer reflect the reduced footprint.

## Acceptance criteria

- [ ] No source imports of the listed MapLibre/Three.js packages remain
- [ ] `maplibre-gl`, `react-map-gl`, `react-three-map`, `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three` removed from `package.json` and lockfile
- [ ] `cesium` and `vite-plugin-cesium` retained
- [ ] `npm run build` succeeds; bundle no longer includes the removed libraries
- [ ] `npm run tsc` and `npm run lint` pass
- [ ] Full editor still works end-to-end (place, select, transform, panel, view cube, idle orbit, autosave)

## Blocked by

- Blocked by #plans/cesium-map-migration/s1-photorealistic-viewer.issue.md
- Blocked by #plans/cesium-map-migration/s2-place-objects-on-ground.issue.md
- Blocked by #plans/cesium-map-migration/s3-selection-highlight.issue.md
- Blocked by #plans/cesium-map-migration/s4-transform-gizmo.issue.md
- Blocked by #plans/cesium-map-migration/s5-properties-panel.issue.md
- Blocked by #plans/cesium-map-migration/s6-viewcube-camera-adapter.issue.md
- Blocked by #plans/cesium-map-migration/s7-idle-orbit-render-loop.issue.md
