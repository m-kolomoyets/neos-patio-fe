import type { Patio, PatioPointCollection, PatioPointFeature } from '../types';

/**
 * Maps a `Patio[]` into a minimal GeoJSON `FeatureCollection<Point>` for the
 * Mapbox clustering source. Keeps only `{ id, isPublished, type }` on each
 * feature — no objects, previews, or other heavy fields. Pure.
 */
export const patiosToPointCollection = (patios: Patio[]): PatioPointCollection => {
    const features: PatioPointFeature[] = patios.map((patio) => {
        return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [patio.coords.lng, patio.coords.lat] },
            properties: {
                id: patio.id,
                isPublished: patio.isPublished,
                type: patio.type,
                ownerAddress: patio.ownerAddress,
                // Wallet-dependent, so never resolved here; see `usePatioPointsWithOwnership`.
                isMine: false,
            },
        };
    });

    return { type: 'FeatureCollection', features };
};
