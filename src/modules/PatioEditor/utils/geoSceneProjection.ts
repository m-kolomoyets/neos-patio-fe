import type { PatioBounds } from '@/services/patios/types';
import { MercatorCoordinate } from 'maplibre-gl';
import { Vector3 } from 'three';

export type LngLatAlt = {
    lng: number;
    lat: number;
    alt?: number;
};

// Scene render origin: the patio bounds center at altitude 0.
export const boundsAnchor = (bounds: PatioBounds): LngLatAlt => {
    const [west, south, east, north] = bounds;
    return { lng: (west + east) / 2, lat: (south + north) / 2, alt: 0 };
};

const toMerc = ({ lng, lat, alt = 0 }: LngLatAlt) => {
    return MercatorCoordinate.fromLngLat([lng, lat], alt);
};

// react-three-map scene axes: X = east, Y = up (altitude), Z = south.
// MercatorCoordinate axes: x = east, y = south, z = altitude (in mercator units).
// So scene.x = merc.x, scene.y = merc.z, scene.z = merc.y (all relative to origin, / scale).

export const geoToScene = (origin: LngLatAlt, point: LngLatAlt): Vector3 => {
    const originMerc = toMerc(origin);
    const pointMerc = toMerc(point);
    const scale = originMerc.meterInMercatorCoordinateUnits();
    return new Vector3(
        (pointMerc.x - originMerc.x) / scale,
        (pointMerc.z - originMerc.z) / scale,
        (pointMerc.y - originMerc.y) / scale
    );
};
