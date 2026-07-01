import type { PatioCollection, PatioFeature } from '../types';
import { PATIO_COUNT_RANGE, PATIO_SIZE_RANGE_M, PATIO_SPREAD_M } from '../constants';

/** Meters per degree of latitude (roughly constant across the globe). */
const METERS_PER_DEG_LAT = 111_320;

/**
 * Mulberry32: a tiny, fast, deterministic PRNG. Same seed → same stream, which
 * keeps the mock patio layout stable across reloads.
 */
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

const lerp = (rng: () => number, min: number, max: number): number => {
    return min + rng() * (max - min);
};

type StartCoordinate = {
    longitude: number;
    latitude: number;
};

/**
 * Deterministically generates a cluster of mock patios around the start
 * coordinate as a GeoJSON `FeatureCollection` of Point features (cluster-ready).
 * Each patio carries its own size (80–160m) and azimuth in `properties`. Pure.
 */
export const generatePatios = (seed: number, start: StartCoordinate): PatioCollection => {
    const rng = createRng(seed);
    const count = Math.round(lerp(rng, PATIO_COUNT_RANGE.min, PATIO_COUNT_RANGE.max));
    const metersPerDegLng = METERS_PER_DEG_LAT * Math.cos((start.latitude * Math.PI) / 180);

    const features: PatioFeature[] = Array.from({ length: count }, () => {
        const offsetEast = lerp(rng, -PATIO_SPREAD_M, PATIO_SPREAD_M);
        const offsetNorth = lerp(rng, -PATIO_SPREAD_M, PATIO_SPREAD_M);
        const longitude = start.longitude + offsetEast / metersPerDegLng;
        const latitude = start.latitude + offsetNorth / METERS_PER_DEG_LAT;

        return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [longitude, latitude] },
            properties: {
                sizeMeters: lerp(rng, PATIO_SIZE_RANGE_M.min, PATIO_SIZE_RANGE_M.max),
                azimuthDeg: lerp(rng, 0, 360),
            },
        };
    });

    return { type: 'FeatureCollection', features };
};
