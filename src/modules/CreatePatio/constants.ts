/**
 * Mapbox base style. Top-down satellite with street labels so creators can
 * recognise real-world locations while placing a patio.
 */
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';

/**
 * Hardcoded camera start: Barcelona, matching the Figma reference. Stored as
 * [longitude, latitude] to mirror GeoJSON coordinate order.
 */
export const START_COORDINATE = {
    longitude: 2.1734,
    latitude: 41.3851,
} as const;

/** Street-level zoom so patio squares are visible without manual zooming. */
export const DEFAULT_ZOOM = 16;

/** Ground footprint of the patio being placed, in meters (100×100m). */
export const PATIO_SIZE_M = 100;

/**
 * `id` given to the create-patio `<Map>` so `useMap()` can resolve it from the
 * `MapProvider` registry outside the map subtree (e.g. the header button).
 */
export const CREATE_PATIO_MAP_ID = 'create-patio';

/**
 * The 100m footprint must fill at least this share of the shorter viewport
 * dimension for the camera to count as "zoomed enough" to place a patio.
 */
export const ZOOM_ENOUGH_RATIO = 0.2;

/**
 * "Zoom in" flies to the zoom where the 100m footprint fills this share of the
 * shorter viewport dimension. Above `ZOOM_ENOUGH_RATIO` so the button reliably
 * flips to "Create patio" after the fly — no boundary flicker.
 */
export const ZOOM_IN_TARGET_RATIO = 0.3;

/**
 * Fallback azimuth (degrees, clockwise from north) before the map camera reports
 * its bearing. The center square renders screen-upright; map drag-rotate turns the
 * world under it rather than rotating the square.
 */
export const DEFAULT_AZIMUTH = 0;

/** Corner radius of every square, in pixels (Figma). */
export const SQUARE_CORNER_RADIUS = 24;

/** Border width of every square, in pixels (Figma). */
export const SQUARE_BORDER_WIDTH = 4;

/** Center-square palette (the patio being placed), lifted from Figma. */
export const CENTER_SQUARE = {
    border: '#ff6a00',
    gradientEdge: '#ff7100',
    gradientOpacity: 0.55,
    insetShadow: 'rgba(161, 94, 5, 0.44)',
} as const;

/** Existing-patio palette (blue equivalent of the center square), per Figma. */
export const PATIO_SQUARE = {
    border: '#315be4',
    gradientEdge: '#315be4',
    gradientOpacity: 0.55,
} as const;

/**
 * Collision palette painted where the center square overlaps a patio. The exact
 * red is lifted from the Figma intersection node — confirm against the design.
 */
export const INTERSECTION = {
    fill: '#ff2d2d',
    fillOpacity: 0.55,
    border: '#ff2d2d',
} as const;

/** Deterministic seed for the mock patio generator — stable across reloads. */
export const PATIO_SEED = 0x5eed;

/** Inclusive bounds for how many mock patios to generate. */
export const PATIO_COUNT_RANGE = { min: 6, max: 8 } as const;

/** Inclusive bounds for a mock patio's side length, in meters. */
export const PATIO_SIZE_RANGE_M = { min: 80, max: 160 } as const;

/** Max distance a mock patio is offset from the start coordinate, in meters. */
export const PATIO_SPREAD_M = 250;
