export type GeocodingSearchParams = {
    /** Free-text place query (address, city, POI). */
    q: string;
    /** Max number of suggestions to return. */
    limit?: number;
};

/**
 * A normalised place suggestion. `name` is the short label (e.g. "Barcelona"),
 * `placeName` the full contextual address, `center` the point to fly the map to.
 */
export type GeocodingFeature = {
    id: string;
    name: string;
    placeName: string;
    center: { longitude: number; latitude: number };
};
