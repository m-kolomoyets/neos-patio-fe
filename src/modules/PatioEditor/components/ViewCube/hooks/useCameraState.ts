import type { MapRef } from 'react-map-gl/maplibre';
import type { CameraState } from '../types';
import { useEffect, useState } from 'react';

const INITIAL_CAMERA: CameraState = { bearing: 0, pitch: 0, zoom: 0 };

/**
 * Subscribes to the map's live `{ bearing, pitch, zoom }` via its `move` event
 * (which also fires on rotate/pitch/zoom).
 *
 * Deliberately kept out of {@link useMapCamera}: only the small leaf components
 * that render the live orientation/zoom call this and re-render per frame, while
 * the ViewCube shell and its controls stay put during pan/orbit/zoom. Ephemeral
 * local state — never touches the EditorContext reducer / undo history.
 */
export const useCameraState = (map: MapRef | null): CameraState => {
    const [camera, setCamera] = useState<CameraState>(INITIAL_CAMERA);

    useEffect(() => {
        if (!map) return undefined;

        const sync = () => {
            setCamera({ bearing: map.getBearing(), pitch: map.getPitch(), zoom: map.getZoom() });
        };

        sync();
        map.on('move', sync);

        return () => {
            map.off('move', sync);
        };
    }, [map]);

    return camera;
};
