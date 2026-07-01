import Map from 'react-map-gl/mapbox';
import { DEFAULT_ZOOM, MAPBOX_STYLE, START_COORDINATE } from './constants';
import { useAzimuth } from './hooks/useAzimuth';
import { SquaresOverlay } from './components/SquaresOverlay';

import 'mapbox-gl/dist/mapbox-gl.css';

import s from './styles.module.css';

/**
 * Create-patio flow: a full-screen top-down satellite map. Tracer-bullet shell —
 * the center square, existing patio squares, and intersection overlay land in
 * later slices.
 */
export const CreatePatio: React.FC = () => {
    // Azimuth setter is held for a future control panel; no UI in this slice.
    const { azimuth } = useAzimuth();

    return (
        <div className={s.wrap}>
            <Map
                mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                mapStyle={MAPBOX_STYLE}
                initialViewState={{
                    longitude: START_COORDINATE.longitude,
                    latitude: START_COORDINATE.latitude,
                    zoom: DEFAULT_ZOOM,
                    pitch: 0,
                    bearing: 0,
                }}
                projection="mercator"
            >
                <SquaresOverlay azimuth={azimuth} />
            </Map>
        </div>
    );
};
