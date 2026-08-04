import { CONTINENT_LABELS } from '@/services/patios/constants';
import { COORDINATE_PRECISION } from '@/modules/CreatePatio/constants';
import { continentAt } from '@/modules/CreatePatio/utils/continentAt';

/** `Europe • 41.38510, 2.17340` — region omitted over open ocean, never empty. */
export const formatLocation = (map: mapboxgl.Map): string => {
    const { lat, lng } = map.getCenter();
    const coordinates = `${lat.toFixed(COORDINATE_PRECISION)}, ${lng.toFixed(COORDINATE_PRECISION)}`;
    const continent = continentAt(lng, lat);

    return continent ? `${CONTINENT_LABELS[continent]} • ${coordinates}` : coordinates;
};
