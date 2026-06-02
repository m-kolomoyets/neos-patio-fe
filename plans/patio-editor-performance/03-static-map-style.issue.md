## What to build

Make the map style a stable static object and remove the dead terrain DEM.

Today the entire `mapStyle` object (sources + layers) is an inline literal rebuilt on every `MapCanvas` render, forcing react-map-gl to re-diff a large object each render. It is fully static.

The terrain-RGB DEM source is declared but never wired to `map.setTerrain` (no `TerrainController` exists) — it fetches and decodes tiles for nothing.

Changes:
1. Hoist the full `mapStyle` (sources + layers) to a module-level constant; interpolate `MAPTILER_KEY` at module load.
2. Remove the terrain-DEM source from the style and the unused terrain fields/ids/comments from the map constants (including the misleading "TerrainController slice" comment).
3. Keep all three raster layers (satellite + transport + labels).
4. Memoize/hoist stable derivations passed to `<Map>` where applicable (`maxBounds`).

## Acceptance criteria

- [ ] `mapStyle` is a stable module-level constant; `<Map>` receives a stable reference (no rebuild per render).
- [ ] Terrain-RGB DEM tiles are no longer requested (verify in Network panel).
- [ ] Unused terrain constants and the "TerrainController slice" comment are removed.
- [ ] Satellite, transport, and labels layers still render; buildings still render.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
