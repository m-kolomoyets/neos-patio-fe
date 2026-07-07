import { useMap } from 'react-map-gl/mapbox';
import { Button } from '@/components/ui/Button';
import { CREATE_PATIO_MAP_ID, PATIO_SIZE_M, ZOOM_ENOUGH_RATIO, ZOOM_IN_TARGET_RATIO } from '../../../../constants';
import { isZoomEnough, minViewportDimension, zoomForFootprint } from '../../../../utils/zoomForFootprint';
import { useCreatePatioMode } from '../../../../context/CreatePatioContext';
import { useMapCamera } from '../../../../hooks/useMapCamera';
import s from './styles.module.css';

/**
 * Header's mode/zoom spine button. Driven by the screen `mode` plus a
 * `zoomEnough` predicate derived from the live camera:
 *
 * - view + not zoomed enough → "Zoom in" → fly to the target zoom.
 * - view + zoomed enough     → "Create patio" → switch to create mode.
 * - create (any zoom)        → "Zoom in" → fly to the target zoom.
 */
export const ModeZoomButton: React.FC = () => {
    const { mode, setMode } = useCreatePatioMode();
    const maps = useMap();
    const camera = useMapCamera();

    // Until the camera reports, treat the map as not zoomed enough.
    const zoomEnough =
        camera !== null &&
        isZoomEnough(
            PATIO_SIZE_M,
            camera.latitude,
            camera.zoom,
            minViewportDimension(camera.width, camera.height),
            ZOOM_ENOUGH_RATIO
        );

    const showCreate = mode === 'view' && zoomEnough;

    const flyToTargetZoom = () => {
        const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];
        if (!mapRef || !camera) return;

        const minDimension = minViewportDimension(camera.width, camera.height);
        const targetZoom = zoomForFootprint(PATIO_SIZE_M, camera.latitude, ZOOM_IN_TARGET_RATIO * minDimension);

        // Center is preserved (omitted); flyTo is animated by default.
        mapRef.getMap().flyTo({ zoom: targetZoom });
    };

    const handleClick = () => {
        if (showCreate) {
            setMode('create');
            return;
        }
        flyToTargetZoom();
    };

    return (
        <Button className={s.wrap} variant={showCreate ? 'brand' : 'surface'} size="md" onClick={handleClick}>
            {showCreate ? 'Create patio' : 'Zoom in'}
        </Button>
    );
};
