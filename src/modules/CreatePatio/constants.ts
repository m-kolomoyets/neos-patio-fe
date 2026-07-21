import type { IndicatorPaletteEntry, IndicatorType } from './types';

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

/** Decimal places coordinates are rendered with in the map popups (Figma). */
export const COORDINATE_PRECISION = 5;

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
 * Mint quote shown in the new-patio popup.
 * TODO(contract): replace with the live price read from the patio contract —
 * both the token amount and its fiat estimate are placeholders today.
 */
export const NEW_PATIO_PRICE = '340 NCR';
export const NEW_PATIO_PRICE_USD = '~$10';

/**
 * Status of a patio that has not been minted yet.
 * TODO(contract): derives from the on-chain state once minting is real.
 */
export const NEW_PATIO_STATUS = 'Draft';

/** Owner shown in the new-patio popup while no wallet is connected. */
export const NEW_PATIO_OWNER_FALLBACK = 'Neos';

/**
 * Fallback azimuth (degrees, clockwise from north) before the map camera reports
 * its bearing. The center square renders screen-upright; map drag-rotate turns the
 * world under it rather than rotating the square.
 */
export const DEFAULT_AZIMUTH = 0;

/**
 * Corner radius of every square, in pixels, at the size the design draws it
 * (`SQUARE_CORNER_RADIUS_BASIS`). Squares are geo-anchored, so their on-screen
 * side grows with zoom — `getCornerRadius` scales the radius by the same ratio,
 * treating this pair as the design's roundness rather than a fixed pixel value.
 */
export const SQUARE_CORNER_RADIUS = 28;
export const SQUARE_CORNER_RADIUS_BASIS = 247;

/** Border width of every square, in pixels (Figma). */
export const SQUARE_BORDER_WIDTH = 4;

/** Center-square palette (the patio being placed), lifted from Figma. */
export const CENTER_SQUARE = {
    border: '#ff6a00',
    gradientEdge: '#ff7100',
    gradientOpacity: 0.55,
    insetShadow: 'rgba(161, 94, 5, 0.44)',
} as const;

/**
 * Reference grid behind the center square (Figma "Group 29"). A lattice of 100×100 m
 * cells — each the same on-screen size as the center square, so its cell pitch is the
 * live `metersToPixels(PATIO_SIZE_M, …)` written per frame by `useGridDriver` — aligned
 * so the cell over the viewport center coincides with the center square. White lines,
 * radially faded toward the edges. `fadeStart`/`fadeEnd` are the radial-gradient stop
 * offsets (fraction of the ellipse radius reaching the mid-edges): fully opaque out to
 * `fadeStart`, gone by `fadeEnd`.
 */
export const GRID = {
    lineColor: '#fff',
    lineWidth: 2,
    opacity: 0.4,
    fadeStart: 0.7,
    fadeEnd: 1,
} as const;

/**
 * `Indicator` palette (Figma 9081:1180) — one entry per indicator type. Each
 * square/badge is painted as a radial fill fading to `gradientEdge` plus an inner
 * glow (`insetShadow`); `pressedBorder` is the 4px ring the design adds in the
 * pressed state, which selection reuses (there is no `selected` variant).
 *
 * Shared by the SVG squares (`SquaresOverlay`) and the DOM singleton badges
 * (`ClusterMarkers`), so the badge→square morph across `MORPH_BAND` is a pure
 * shape change with no color jump. Clusters are deliberately *not* in here — they
 * stay two-color (blue when `hasUnpublished`, green otherwise).
 */
export const INDICATOR_PALETTE = {
    /** Published, not mine — green. */
    owned: {
        gradientEdge: '#0eb838',
        gradientOpacity: 0.55,
        insetShadow: 'rgba(14, 184, 56, 0.8)',
        pressedBorder: '#01de37',
        badgeFill: 'rgba(14, 184, 56, 0.6)',
    },
    /** Not published, not mine — blue (the previous flat treatment for every patio). */
    'not-published': {
        gradientEdge: '#007aff',
        gradientOpacity: 0.55,
        insetShadow: 'rgba(0, 122, 255, 0.7)',
        pressedBorder: '#4ca2ff',
        badgeFill: 'rgba(0, 122, 255, 0.6)',
    },
    /** Published and mine — orange. */
    'owned-and-published': {
        gradientEdge: '#ff9d00',
        gradientOpacity: 0.55,
        insetShadow: 'rgba(255, 157, 0, 0.8)',
        pressedBorder: '#ff9d00',
        badgeFill: 'rgba(255, 157, 0, 0.6)',
    },
    /** Not published and mine — yellow. */
    'owned-and-not-published': {
        gradientEdge: '#ffe100',
        gradientOpacity: 0.55,
        insetShadow: 'rgba(255, 225, 0, 0.8)',
        pressedBorder: '#ffe100',
        badgeFill: 'rgba(255, 225, 0, 0.6)',
    },
    /** The create-mode center cursor — dark orange, unchanged from `CENTER_SQUARE`. */
    target: {
        gradientEdge: CENTER_SQUARE.gradientEdge,
        gradientOpacity: CENTER_SQUARE.gradientOpacity,
        insetShadow: CENTER_SQUARE.insetShadow,
        pressedBorder: CENTER_SQUARE.border,
        badgeFill: 'rgba(255, 113, 0, 0.55)',
    },
} as const satisfies Record<IndicatorType, IndicatorPaletteEntry>;

/**
 * The pair of white inner highlights every *unselected* indicator carries (Figma
 * 9081:1180 default/hovered, and the ring-less clusters at 9096:429): a soft lit
 * edge bottom-right, a brighter one top-left. `blur` is the CSS blur radius —
 * SVG filters halve it for `stdDeviation` — and `spread` reaches further inward
 * than Figma's -2px so the lit edge reads at map scale, where a square is many
 * times the 247px artboard. The selected (pressed) square drops them in favour of
 * its solid accent ring.
 */
export const INDICATOR_HIGHLIGHTS = [
    { color: 'rgba(255, 255, 255, 0.9)', blur: 5.8, dx: 2, dy: 3, spread: -2 },
    { color: 'rgba(255, 255, 255, 0.8)', blur: 5.8, dx: -3, dy: -2, spread: -2 },
] as const;

/**
 * Middle stop of every indicator's radial fill, as a fraction of the radius and a
 * fraction of `gradientOpacity`. Two stops ramp linearly and leave the square
 * evenly tinted; holding the mid-point low keeps the center readable and packs the
 * color into the outer edge, where the design puts it.
 */
export const INDICATOR_FILL_MID = {
    offset: 0.6,
    opacityRatio: 0.3,
} as const;

/**
 * Diagonal sheen the design lays over every indicator's inner rectangle (Figma
 * 9081:1180): a 222.5° linear gradient in the type's own accent — bright at the
 * top-right and bottom-left corners, all but gone across the middle. `stops` are
 * the pressed alphas; the unpressed states are the same ramp scaled down by
 * `restOpacity`, which is how the design draws them (0.25 → 0.01).
 */
export const INDICATOR_SHEEN = {
    stops: [
        { offset: 0.17734, opacity: 0.25 },
        { offset: 0.46843, opacity: 0.005 },
        { offset: 0.82838, opacity: 0.25 },
    ],
    restOpacity: 0.04,
} as const;

/**
 * White radial wash the design lays over a hovered indicator (Figma: a 35%
 * bottom-anchored white gradient). Rendered as its own overlay rect per square so
 * hover is a pure CSS opacity flip on an already-mounted node.
 */
export const INDICATOR_HOVER_GLOW_OPACITY = 0.35;

/**
 * Collision palette painted where the center square overlaps a patio. The exact
 * red is lifted from the Figma intersection node — confirm against the design.
 */
export const INTERSECTION = {
    fill: '#ff0000',
    fillOpacity: 0.8,
    border: '#ff0404',
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

/**
 * Mount zoom: the whole planet in frame, so the flow opens on the globe and the
 * idle spin reads immediately. Street-level framing (`DEFAULT_ZOOM`) is reached
 * by search or by zooming in.
 */
export const GLOBE_START_ZOOM = 1.2;

/**
 * Above this zoom the globe has effectively flattened into the mercator plane,
 * so the idle spin stops — it only ever runs while the sphere is visible.
 */
export const GLOBE_SPIN_MAX_ZOOM = 4;

/** Idle spin rate, degrees of longitude per second. */
export const GLOBE_SPIN_DEG_PER_SEC = 3;

/** Quiet time after the last interaction before the idle spin resumes. */
export const GLOBE_SPIN_IDLE_DELAY_MS = 3_000;

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
