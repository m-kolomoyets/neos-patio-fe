import { MercatorCoordinate } from 'maplibre-gl';
import { Vector3 } from 'three';

export type LngLatAlt = {
    lng: number;
    lat: number;
    alt?: number;
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

export const sceneToGeo = (origin: LngLatAlt, vec: Vector3): LngLatAlt => {
    const originMerc = toMerc(origin);
    const scale = originMerc.meterInMercatorCoordinateUnits();
    const merc = new MercatorCoordinate(
        originMerc.x + vec.x * scale,
        originMerc.y + vec.z * scale,
        originMerc.z + vec.y * scale
    );
    const ll = merc.toLngLat();
    return { lng: ll.lng, lat: ll.lat, alt: merc.toAltitude() };
};
