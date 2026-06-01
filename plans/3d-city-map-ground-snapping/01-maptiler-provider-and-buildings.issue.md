# MapTiler provider + 3D buildings

## What to build

Add the MapTiler vector tile provider and render extruded 3D buildings over the existing Esri satellite basemap in the Patio Editor. This is the foundation slice: it wires the provider API key through the env-validation flow, centralizes map config, and proves the provider works by drawing buildings with real heights.

End-to-end behavior: with `VITE_MAPTILER_KEY` set, opening the editor and zooming to street level (zoom ≥14) over a city shows grey 3D building extrusions sitting on top of the satellite imagery. The satellite basemap is retained — buildings are an additive layer, not a style switch.

Type: **AFK**. (Key assumed available / placeholder; no human gate.)

## Acceptance criteria

- [ ] `VITE_MAPTILER_KEY` added to the Zod `envSchema` and to the Vite env type declarations; missing key fails fast at boot via `checkEnv`.
- [ ] A scope-local map-config module exports: MapTiler key, vector tiles URL, terrain DEM URL, terrain exaggeration constant, and source/layer id constants. (Terrain values defined here now, consumed in slice 2.)
- [ ] MapTiler `vector` source registered in the map style.
- [ ] A `fill-extrusion` buildings layer (`source-layer: 'building'`, `minzoom: 14`, height from `render_height`, base from `render_min_height`) drawn on top of the Esri raster layers.
- [ ] Esri satellite basemap still renders underneath buildings.
- [ ] Buildings do not appear below zoom 14.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
