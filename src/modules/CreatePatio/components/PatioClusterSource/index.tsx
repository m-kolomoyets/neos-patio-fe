import type { CircleLayerSpecification } from 'mapbox-gl';
import type { PatioPointCollection } from '@/services/patios/types';
import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/mapbox';
import { CLUSTER_MAX_ZOOM, CLUSTER_RADIUS, PATIO_CLUSTER_SOURCE_ID, START_COORDINATE } from '../../constants';
import { derivePatioMapGeometry } from '../../utils/derivePatioMapGeometry';
import { usePatioPointsWithOwnership } from '../../hooks/usePatioPointsWithOwnership';

/**
 * Invisible probe layer. Mapbox only tiles (and clusters) a GeoJSON source when
 * a layer references it — with none, `querySourceFeatures` returns nothing and no
 * badges appear. This zero-opacity circle forces the source to load without
 * drawing anything; the visible markers are DOM `<Marker>`s in `ClusterMarkers`.
 */
const probeLayer: CircleLayerSpecification = {
    id: `${PATIO_CLUSTER_SOURCE_ID}-probe`,
    type: 'circle',
    source: PATIO_CLUSTER_SOURCE_ID,
    paint: { 'circle-opacity': 0, 'circle-radius': 0 },
};

/**
 * Native Mapbox clustering source feeding the browse/globe view. `cluster: true`
 * lets supercluster compute counts + expansion zoom; `clusterProperties`
 * aggregates `hasUnpublished` so a cluster colors blue without walking leaves.
 * Rendering is DOM-based (`ClusterMarkers` queries this source); the only GL
 * layer is an invisible probe that keeps the source tiled.
 */
export const PatioClusterSource: React.FC = () => {
    const data = usePatioPointsWithOwnership();

    // Relocate each patio near the start via the shared derivation (properties —
    // id/isPublished/type/isMine — untouched) so clustering matches the placement squares.
    const relocated = useMemo<PatioPointCollection>(() => {
        return {
            ...data,
            features: data.features.map((feature) => {
                const { longitude, latitude } = derivePatioMapGeometry(feature.properties.id, START_COORDINATE);

                return { ...feature, geometry: { type: 'Point', coordinates: [longitude, latitude] } };
            }),
        };
    }, [data]);

    return (
        <Source
            id={PATIO_CLUSTER_SOURCE_ID}
            type="geojson"
            data={relocated}
            cluster
            clusterRadius={CLUSTER_RADIUS}
            clusterMaxZoom={CLUSTER_MAX_ZOOM}
            clusterProperties={{
                // true when any member is unpublished (isPublished === false).
                hasUnpublished: ['any', ['!', ['get', 'isPublished']]],
            }}
        >
            <Layer {...probeLayer} />
        </Source>
    );
};
