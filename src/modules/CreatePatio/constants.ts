/**
 * Mapbox base style — the "aerial" view (light vector street map). Satellite is
 * layered on top as a raster overlay (`SatelliteLayer`) whose opacity cross-fades
 * on view change, so switching never calls `setStyle` and never disturbs the
 * clustering source, DOM markers, or globe fog. See `MapView`.
 */
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v12';

/** Mapbox-hosted satellite raster tileset feeding the satellite overlay. */
export const SATELLITE_RASTER_URL = 'mapbox://mapbox.satellite';

/** Source/layer ids for the satellite raster overlay toggled by the view tabs. */
export const SATELLITE_RASTER_SOURCE_ID = 'satellite-raster';
export const SATELLITE_RASTER_LAYER_ID = 'satellite-raster-layer';

/** localStorage key persisting the last-selected map view across reloads. */
export const MAP_VIEW_STORAGE_KEY = 'create-patio:map-view';

/** Default map view before any user choice is stored. */
export const DEFAULT_MAP_VIEW = 'satellite';

/** Duration (ms) of the satellite⇆aerial raster-opacity cross-fade. */
export const MAP_VIEW_CROSSFADE_MS = 350;

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
export const SQUARE_CORNER_RADIUS = 28;

/** Border width of every square, in pixels (Figma). */
export const SQUARE_BORDER_WIDTH = 4;

/** Center-square palette (the patio being placed), lifted from Figma. */
export const CENTER_SQUARE = {
    border: '#ff6a00',
    gradientEdge: '#ff7100',
    gradientOpacity: 0.55,
    insetShadow: 'rgba(161, 94, 5, 0.44)',
} as const;

/** Existing-patio palette (blue), lifted from Figma node 9555:14606. */
export const PATIO_SQUARE = {
    border: '#258dff',
    gradientEdge: '#007aff',
    gradientOpacity: 0.35,
    insetShadow: 'rgba(0, 122, 255, 0.7)',
} as const;

/**
 * Collision palette painted where the center square overlaps a patio. The exact
 * red is lifted from the Figma intersection node — confirm against the design.
 */
export const INTERSECTION = {
    fill: '#ff0000',
    fillOpacity: 0.8,
    border: '##FF0404',
} as const;

/**
 * Zoom at/below which the GeoJSON source merges patios into count bubbles. Set
 * well below the morph band so individual patios (squares up top, circles lower)
 * persist across a wide range and the user must zoom out a lot before the cluster
 * view takes over. Must stay under `MORPH_BAND.min` so morphing and clustering
 * never overlap.
 */
export const CLUSTER_MAX_ZOOM = 13;

/** Supercluster grouping radius, in pixels. */
export const CLUSTER_RADIUS = 60;

/**
 * Shared id of the clustering GeoJSON source. `PatioClusterSource` registers it;
 * `ClusterMarkers` reads it back via `querySourceFeatures` to draw DOM badges.
 */
export const PATIO_CLUSTER_SOURCE_ID = 'patio-points';

/**
 * Morph band: across this zoom range each marker tweens between its geo-accurate
 * square (top) and the fixed circle (bottom). Disjoint from `CLUSTER_MAX_ZOOM`
 * by design — retune both together or morphing and clustering will conflict.
 */
export const MORPH_BAND = { min: 14, max: 17 } as const;

/**
 * Placement threshold. Footprint placement/reposition and every create-mode
 * placement interaction are live only at/above this zoom; below it the map is
 * browse-only (pan, zoom, tap cluster → expand, tap patio → select). Equals the
 * top of the morph band; the two representations cross-fade across `CROSSFADE_BAND`
 * just below it and each layer's mount/unmount lands at zero opacity, so the swap
 * is never visible. Shared by the map click handler and `usePlacementEnabled` so
 * the interaction gate never drifts.
 */
export const PLACEMENT_MIN_ZOOM = MORPH_BAND.max;

/**
 * Cross-fade band for the browse ⇆ placement handoff. Across this narrow zoom
 * range straddling `PLACEMENT_MIN_ZOOM` the morphing DOM markers (browse) and the
 * geo SVG squares (placement) co-render and cross-fade their opacity in lockstep,
 * so neither layer ever pops in/out at full opacity. The band top equals
 * `PLACEMENT_MIN_ZOOM`, so above it only the squares remain (opacity 1) and the
 * markers have already faded to 0 — the React mount/unmount then happens while the
 * outgoing layer is invisible, hiding the swap entirely. Stays inside `MORPH_BAND`
 * so the markers are still near-square where they cross-fade with the squares.
 */
export const CROSSFADE_BAND = { min: MORPH_BAND.max - 0.75, max: MORPH_BAND.max } as const;

/**
 * Extra zoom added past a cluster's supercluster expansion zoom on tap, so the
 * camera lands a bit closer than the exact break-apart point.
 */
export const CLUSTER_EXPAND_ZOOM_PADDING = 1.5;

/**
 * Zoom a lone patio flies to when its badge is tapped — above the placement
 * threshold so its 100×100m square is rendered close enough to read.
 */
export const SINGLE_PATIO_VIEW_ZOOM = 18;

/** Globe projection reaches the full planet at this zoom. */
export const GLOBE_MIN_ZOOM = 0;

/** Count-bubble diameter (px) by member count. Extendable to a third tier. */
export const BADGE_SIZE_SM = 42;
export const BADGE_SIZE_LG = 48;

/** At/above this count a bubble steps up from `BADGE_SIZE_SM` to `BADGE_SIZE_LG`. */
export const BADGE_SIZE_LG_THRESHOLD = 10;

/**
 * Mapbox atmosphere (`setFog`) applied on globe load — sky tint plus a subtle
 * star haze. No 3D terrain; the flat satellite style wraps the sphere.
 */
export const GLOBE_FOG = {
    color: 'rgb(186, 210, 235)',
    'high-color': 'rgb(36, 92, 223)',
    'horizon-blend': 0.02,
    'space-color': 'rgb(11, 11, 25)',
    'star-intensity': 0.6,
} as const;
