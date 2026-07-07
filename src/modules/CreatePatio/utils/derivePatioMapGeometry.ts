/** Meters per degree of latitude (roughly constant across the globe). */
const METERS_PER_DEG_LAT = 111_320;

type StartCoordinate = {
    longitude: number;
    latitude: number;
};

/** Deterministic map placement + orientation for one patio, keyed by its id. */
export type PatioMapGeometry = {
    longitude: number;
    latitude: number;
    /** Azimuth in degrees, clockwise from north. Footprint is a fixed 100×100m. */
    azimuthDeg: number;
};

/** FNV-1a hash of a patio id → uint32 seed. Stable across reloads. */
const hashId = (id: string): number => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < id.length; i += 1) {
        hash ^= id.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }

    return hash >>> 0;
};

/** Mulberry32: tiny deterministic PRNG. Same seed → same stream. */
const createRng = (seed: number) => {
    let state = seed >>> 0;

    return (): number => {
        state |= 0;
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

        return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
    };
};

/**
 * Hub offsets (meters east/north from start) that seed mixed-density groups: a
 * few tight clusters plus a far outlier, so browsing shows several count bubbles
 * and at least one lone patio. Points around one hub cluster at low zoom and
 * break into individual squares near the placement band.
 */
const HUBS = [
    { east: 0, north: 0 },
    { east: 950, north: 500 },
    { east: -1100, north: -250 },
    { east: 250, north: -1500 },
] as const;

/** Per-point scatter around its hub, in meters. */
const HUB_JITTER_M = 180;

/**
 * Maps a patio id to a stable position near `start`, plus its footprint size and
 * azimuth. The single source of map geometry: `useSquares`, the click hit-test,
 * and the clustering source all relocate the same fixture set through this, so
 * the squares seen while placing are exactly the points that cluster on zoom-out.
 * Pure.
 */
export const derivePatioMapGeometry = (id: string, start: StartCoordinate): PatioMapGeometry => {
    const rng = createRng(hashId(id));
    const hub = HUBS[Math.floor(rng() * HUBS.length)];

    const offsetEast = hub.east + (rng() * 2 - 1) * HUB_JITTER_M;
    const offsetNorth = hub.north + (rng() * 2 - 1) * HUB_JITTER_M;

    const metersPerDegLng = METERS_PER_DEG_LAT * Math.cos((start.latitude * Math.PI) / 180);

    return {
        longitude: start.longitude + offsetEast / metersPerDegLng,
        latitude: start.latitude + offsetNorth / METERS_PER_DEG_LAT,
        azimuthDeg: rng() * 360,
    };
};
