import type { GeocodingFeature, GeocodingSearchParams } from './types';
import ky from 'ky';

/**
 * Mapbox Geocoding REST (forward, v6). Uses a standalone `ky` call rather than the
 * app `http` instance since it targets Mapbox, not `VITE_API_URL`, and authenticates
 * with the existing `VITE_MAPBOX_TOKEN` — no new dependency.
 */
const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/search/geocode/v6/forward';

const DEFAULT_LIMIT = 6;

type MapboxV6Feature = {
    id?: string;
    properties?: {
        mapbox_id?: string;
        name?: string;
        full_address?: string;
        place_formatted?: string;
        coordinates?: { longitude: number; latitude: number };
    };
    geometry?: { coordinates: [longitude: number, latitude: number] };
};

type MapboxV6Response = {
    features: MapboxV6Feature[];
};

export const searchPlaces = async (
    params: GeocodingSearchParams,
    signal?: AbortSignal
): Promise<GeocodingFeature[]> => {
    const { q, limit = DEFAULT_LIMIT } = params;

    const response = await ky
        .get(MAPBOX_GEOCODING_URL, {
            searchParams: {
                q,
                limit,
                access_token: import.meta.env.VITE_MAPBOX_TOKEN,
            },
            signal,
        })
        .json<MapboxV6Response>();

    return response.features.map((feature, index) => {
        const props = feature.properties ?? {};
        const [lng, lat] = feature.geometry?.coordinates ?? [
            props.coordinates?.longitude ?? 0,
            props.coordinates?.latitude ?? 0,
        ];

        return {
            id: props.mapbox_id ?? feature.id ?? `${index}`,
            name: props.name ?? props.full_address ?? '',
            placeName: props.full_address ?? props.place_formatted ?? props.name ?? '',
            center: { longitude: lng, latitude: lat },
        };
    });
};
