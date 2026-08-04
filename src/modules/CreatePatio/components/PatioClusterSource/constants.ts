import type { CircleLayerSpecification } from 'mapbox-gl';
import { PATIO_CLUSTER_SOURCE_ID } from '../../constants';

/**
 * Invisible probe layer. Mapbox only tiles (and clusters) a GeoJSON source when
 * a layer references it — with none, `querySourceFeatures` returns nothing and no
 * badges appear. This zero-opacity circle forces the source to load without
 * drawing anything; the visible markers are DOM `<Marker>`s in `ClusterMarkers`.
 */
export const probeLayer: CircleLayerSpecification = {
    id: `${PATIO_CLUSTER_SOURCE_ID}-probe`,
    type: 'circle',
    source: PATIO_CLUSTER_SOURCE_ID,
    paint: { 'circle-opacity': 0, 'circle-radius': 0 },
};
