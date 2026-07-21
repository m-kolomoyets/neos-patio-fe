import type { Continent } from '@/services/patios/types';

type ContinentBox = {
    continent: Continent;
    west: number;
    south: number;
    east: number;
    north: number;
};

/**
 * Coarse continent bounding boxes, ordered so that overlaps resolve to the
 * expected answer (Europe wins over Asia around Turkey, Oceania over Asia in the
 * southern Pacific). Deliberately approximate: the new-patio popup only needs a
 * human-readable region next to the live coordinates, not a geopolitical lookup.
 */
const CONTINENT_BOXES: ContinentBox[] = [
    { continent: 'europe', west: -25, south: 36, east: 40, north: 72 },
    { continent: 'africa', west: -20, south: -35, east: 52, north: 37 },
    { continent: 'north-america', west: -170, south: 7, east: -50, north: 84 },
    { continent: 'south-america', west: -82, south: -56, east: -34, north: 13 },
    { continent: 'oceania', west: 110, south: -50, east: 180, north: 0 },
    { continent: 'asia', west: 25, south: -11, east: 180, north: 82 },
];

/**
 * Continent containing a coordinate, or `null` over open ocean and the poles —
 * the caller then renders coordinates alone rather than an empty region. Pure.
 */
export const continentAt = (longitude: number, latitude: number): Continent | null => {
    const box = CONTINENT_BOXES.find((candidate) => {
        return (
            longitude >= candidate.west &&
            longitude <= candidate.east &&
            latitude >= candidate.south &&
            latitude <= candidate.north
        );
    });

    return box?.continent ?? null;
};
