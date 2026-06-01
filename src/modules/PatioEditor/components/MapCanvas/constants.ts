export const DEFAULT_PITCH = 45;
export const DEFAULT_BEARING = 0;
export const DEFAULT_ZOOM = 15;

/**
 * Single source of truth for the MapTiler provider: API key, tile source URLs,
 * terrain exaggeration, and the source/layer ids referenced by the map style.
 * Terrain values are defined here now and consumed by the TerrainController slice.
 */

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export const MAP_CONFIG = {
    /** MapTiler openmaptiles vector tiles (carries the `building` source-layer). */
    vectorTilesUrl: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
    /** MapTiler terrain-RGB DEM tiles (mapbox encoding). */
    terrainDemUrl: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_KEY}`,
    /** Fixed at 1 so queried elevation equals rendered ground height. */
    terrainExaggeration: 1,
} as const;

export const MAP_SOURCE_IDS = {
    vector: 'maptiler-vector',
    terrainDem: 'maptiler-terrain-dem',
} as const;

export const MAP_LAYER_IDS = {
    buildings: 'maptiler-buildings',
} as const;

/** Buildings only render at street level and above. */
export const BUILDINGS_MIN_ZOOM = 14;

/** openmaptiles building schema property names. */
export const BUILDINGS_SOURCE_LAYER = 'building';
