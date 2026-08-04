import type { PatioPointCollection } from '@/services/patios/types';
import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/mapbox';
import { CLUSTER_MAX_ZOOM, CLUSTER_RADIUS, PATIO_CLUSTER_SOURCE_ID, START_COORDINATE } from '../../constants';
import { probeLayer } from './constants';
import { derivePatioMapGeometry } from '../../utils/derivePatioMapGeometry';
import { usePatioPointsWithOwnership } from '../../hooks/usePatioPointsWithOwnership';

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
