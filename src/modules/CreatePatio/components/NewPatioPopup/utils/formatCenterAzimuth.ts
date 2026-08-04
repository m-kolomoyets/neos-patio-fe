import { formatAzimuth } from '@/modules/CreatePatio/utils/formatAzimuth';
import { getProjectedNorthDeg } from '@/modules/CreatePatio/utils/getProjectedNorthDeg';

/**
 * Geographic azimuth of the footprint about to be minted. The center square is
 * drawn screen-upright (`useSquaresDriver`, `azimuthDeg: 0`), so rotating the map
 * turns the world under it — its world azimuth is the negated screen angle of north.
 */
export const formatCenterAzimuth = (map: mapboxgl.Map): string => {
    const { lat, lng } = map.getCenter();

    return formatAzimuth(-getProjectedNorthDeg(map, lng, lat));
};
