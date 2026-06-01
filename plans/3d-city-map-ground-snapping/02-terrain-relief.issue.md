# Terrain relief

## What to build

Render real ground elevation (terrain relief) in the editor map using MapTiler terrain-RGB DEM tiles. Terrain is enabled imperatively on the live MapLibre map so the ground shows hills and slopes when the camera is tilted.

End-to-end behavior: opening the editor over hilly terrain and tilting the camera (via NavigationControl) shows the ground rising and falling with real elevation, instead of a flat plane. Building extrusions from slice 1 sit on the relief.

Type: **AFK**.

## Acceptance criteria

- [ ] `raster-dem` source (MapTiler terrain-rgb-v2) registered with `encoding: 'mapbox'`.
- [ ] A `null`-rendering `TerrainController` mounted inside the react-three-map `<Canvas>` enables terrain via `map.setTerrain({ source, exaggeration })` using the live map from `useMap()`.
- [ ] Terrain enables on style `load` if not ready at mount; torn down with `setTerrain(null)` on unmount.
- [ ] Exaggeration fixed at `1` (sourced from the map-config module).
- [ ] Tilting the camera over hilly terrain shows visible relief; Network tab shows `terrain-rgb-v2` 200 responses.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-maptiler-provider-and-buildings (key + map-config module).
