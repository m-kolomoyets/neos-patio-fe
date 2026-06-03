import type { StyleSpecification } from 'maplibre-gl';

export const DEFAULT_PITCH = 45;
export const DEFAULT_BEARING = 0;
export const DEFAULT_ZOOM = 15;

/**
 * Single source of truth for the MapTiler provider: API key, tile source URLs,
 * and the source/layer ids referenced by the map style.
 */

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export const MAP_CONFIG = {
    /** MapTiler openmaptiles vector tiles (carries the `building` source-layer). */
    vectorTilesUrl: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
    /** MapTiler satellite raster: consistent global coverage, no ESRI placeholder tiles. */
    satelliteTilesUrl: `https://api.maptiler.com/maps/hybrid-v4/256/{z}/{x}/{y}@2x.jpg?key=${MAPTILER_KEY}`,
} as const;

export const MAP_SOURCE_IDS = {
    vector: 'maptiler-vector',
    satellite: 'maptiler-satellite',
} as const;

export const MAP_LAYER_IDS = {
    buildings: 'maptiler-buildings',
} as const;

/** Buildings only render at street level and above. */
export const BUILDINGS_MIN_ZOOM = 14;

/** openmaptiles building schema property names. */
export const BUILDINGS_SOURCE_LAYER = 'building';

/**
 * Fully static map style. Hoisted to module scope so `<Map>` receives a stable
 * reference and react-map-gl does not re-diff a large literal on every render.
 * Three raster layers (satellite + transport + labels) plus extruded buildings.
 */
export const MAP_STYLE: StyleSpecification = {
    version: 8,
    sources: {
        [MAP_SOURCE_IDS.satellite]: {
            type: 'raster',
            tiles: [MAP_CONFIG.satelliteTilesUrl],
            tileSize: 512,
            // MapTiler satellite-v2 serves real imagery to ~z20 globally; maplibre
            // overzooms past that, so the map stays visible at deep zoom with no
            // "Map data not yet available" placeholder.
            maxzoom: 20,
            attribution: '© MapTiler © OpenStreetMap contributors',
        },
        'esri-transport': {
            type: 'raster',
            tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 18,
        },
        'esri-labels': {
            type: 'raster',
            tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 18,
        },
        [MAP_SOURCE_IDS.vector]: {
            type: 'vector',
            url: MAP_CONFIG.vectorTilesUrl,
        },
    },
    layers: [
        // { id: 'esri-satellite', type: 'raster', source: 'esri-satellite' },
        { id: MAP_SOURCE_IDS.satellite, type: 'raster', source: MAP_SOURCE_IDS.satellite },
        { id: 'esri-transport', type: 'raster', source: 'esri-transport' },
        { id: 'esri-labels', type: 'raster', source: 'esri-labels' },
        {
            id: MAP_LAYER_IDS.buildings,
            type: 'fill-extrusion',
            source: MAP_SOURCE_IDS.vector,
            'source-layer': BUILDINGS_SOURCE_LAYER,
            minzoom: BUILDINGS_MIN_ZOOM,
            paint: {
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': ['get', 'render_height'],
                'fill-extrusion-base': ['get', 'render_min_height'],
                'fill-extrusion-opacity': 0.85,
            },
        },
    ],
};
