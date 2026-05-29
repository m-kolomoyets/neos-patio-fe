## What to build

Wire three.js into the MapLibre map via `react-three-map`. Install `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, `react-three-map`. Create the `GeoSceneProjection` module — a pure utility that converts `{ lng, lat, alt }` to `THREE.Vector3` using `MercatorCoordinate.fromLngLat` + `meterInMercatorCoordinateUnits()`, plus the inverse. Prove the seam: render a sentinel cube at the patio center using `GeoSceneProjection`, confirm it stays geo-anchored as the user pans, zooms, and tilts.

HITL: this is the core architectural integration. The fallback (raw MapLibre custom layer + manual three.js scene) should be confirmed unnecessary before broader work lands on top.

## Acceptance criteria

- [ ] `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, `react-three-map` installed via `npm-audit-install`
- [ ] `src/modules/PatioEditor/utils/geoSceneProjection.ts` exports `geoToScene(lngLatAlt)` and `sceneToGeo(vec3)` as pure functions
- [ ] Round-trip `sceneToGeo(geoToScene(x)) ≈ x` within float epsilon for the patio center and corners
- [ ] `react-three-map` `<Canvas>` mounted as a MapLibre custom layer inside `MapCanvas`
- [ ] A sentinel cube renders at the patio center and visibly stays anchored to that geo coordinate while panning, zooming, and tilting
- [ ] No drift relative to map features across pan / zoom / tilt
- [ ] `npm run tsc` and `npm run lint` clean

## Blocked by

- Blocked by `02-maplibre-bounded-3d-map.issue.md`
