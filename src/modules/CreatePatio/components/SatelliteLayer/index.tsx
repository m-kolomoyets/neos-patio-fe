import type { RasterLayerSpecification } from 'mapbox-gl';
import { Layer, Source } from 'react-map-gl/mapbox';
import {
    MAP_VIEW_CROSSFADE_MS,
    SATELLITE_RASTER_LAYER_ID,
    SATELLITE_RASTER_SOURCE_ID,
    SATELLITE_RASTER_URL,
} from '../../constants';
import { prefersReducedMotion } from '../../utils/prefersReducedMotion';
import { readStoredMapView } from '../../hooks/useMapView';

// Initial opacity matches the persisted view on first paint (satellite → opaque,
// aerial → hidden), so there's no flash before the tabs mount. `MapViewTabs`
// drives every later change imperatively via `setPaintProperty`.
const initialOpacity = readStoredMapView() === 'satellite' ? 1 : 0;

const satelliteLayer: RasterLayerSpecification = {
    id: SATELLITE_RASTER_LAYER_ID,
    type: 'raster',
    source: SATELLITE_RASTER_SOURCE_ID,
    paint: {
        'raster-opacity': initialOpacity,
        // Mapbox tweens raster-opacity over this duration on change — the whole
        // satellite⇆aerial cross-fade, for free. Reduced motion swaps instantly.
        'raster-opacity-transition': {
            duration: prefersReducedMotion() ? 0 : MAP_VIEW_CROSSFADE_MS,
            delay: 0,
        },
    },
};

/**
 * Satellite raster overlaid on the aerial (`streets-v12`) base. Sits above every
 * vector layer, so at full opacity it hides all roads/labels — the "just
 * satellite images" view — and at zero reveals the aerial map underneath. Toggled
 * by opacity alone (never `setStyle`), so the clustering source, DOM markers, and
 * globe fog are never rebuilt when the view changes.
 */
export const SatelliteLayer: React.FC = () => {
    return (
        <Source id={SATELLITE_RASTER_SOURCE_ID} type="raster" url={SATELLITE_RASTER_URL} tileSize={256}>
            <Layer {...satelliteLayer} />
        </Source>
    );
};
