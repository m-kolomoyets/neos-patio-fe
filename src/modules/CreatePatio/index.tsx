import Map, { MapProvider } from 'react-map-gl/mapbox';
import { getAppBackground } from '@/lib/appBackground';
import { useSquircleClipPath } from '@/hooks/useSquircleClipPath';
import { ActionBar } from '@/components/ActionBar';
import { AppBackground } from '@/components/AppBackground';
import {
    CREATE_PATIO_MAP_ID,
    DEFAULT_ZOOM,
    GLOBE_FOG,
    GLOBE_MIN_ZOOM,
    MAPBOX_STYLE,
    START_COORDINATE,
} from './constants';
import { prefersReducedMotion } from './utils/prefersReducedMotion';
import { CreatePatioProvider } from './context/CreatePatioContext';
import { ClusterMarkers } from './components/ClusterMarkers';
import { Header } from './components/Header';
import { MapViewTabs } from './components/MapViewTabs';
import { PatioClusterSource } from './components/PatioClusterSource';
import { SatelliteLayer } from './components/SatelliteLayer';
import { SquaresOverlay } from './components/SquaresOverlay';

import 'mapbox-gl/dist/mapbox-gl.css';

import s from './styles.module.css';

// Inherits the background Home picked (persisted). No own re-roll.
const createPatioBackgroundSrc = getAppBackground();

/**
 * Create-patio flow: a top-down satellite map framed in the same rounded
 * (squircle) surface Home uses. Static header on top, map fills the rest.
 * The center square, existing patio squares, and intersection overlay land in
 * later slices.
 */
export const CreatePatio: React.FC = () => {
    // Squircle corners matching Home (border-radius: 2.5rem = 40px).
    const [surfaceRef, surfaceSquircleStyle] = useSquircleClipPath<HTMLElement>({ cornerRadius: 40 });
    // Inner squircle clipping the map region (22px).
    const [mapRef, mapSquircleStyle] = useSquircleClipPath<HTMLDivElement>({ cornerRadius: 22 });

    return (
        <MapProvider>
            <CreatePatioProvider>
                <div className={s.wrap}>
                    <AppBackground src={createPatioBackgroundSrc} />
                    <main ref={surfaceRef} className={s.surface} style={surfaceSquircleStyle}>
                        <Header />
                        <div className={s.map}>
                            <div ref={mapRef} className={s['map-clip']} style={mapSquircleStyle}>
                                <Map
                                    id={CREATE_PATIO_MAP_ID}
                                    mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                                    mapStyle={MAPBOX_STYLE}
                                    initialViewState={{
                                        longitude: START_COORDINATE.longitude,
                                        latitude: START_COORDINATE.latitude,
                                        zoom: DEFAULT_ZOOM,
                                        pitch: 0,
                                        bearing: 0,
                                    }}
                                    projection="globe"
                                    minZoom={GLOBE_MIN_ZOOM}
                                    dragRotate
                                    pitchWithRotate={false}
                                    touchPitch={false}
                                    maxPitch={0}
                                    onLoad={(e) => {
                                        // Atmosphere on the globe: sky tint + subtle star haze.
                                        // Reduced motion kills the star shimmer (intensity 0).
                                        e.target.setFog({
                                            ...GLOBE_FOG,
                                            'star-intensity': prefersReducedMotion() ? 0 : GLOBE_FOG['star-intensity'],
                                        });
                                    }}
                                >
                                    <SatelliteLayer />
                                    <PatioClusterSource />
                                    <ClusterMarkers />
                                    <SquaresOverlay />
                                </Map>
                            </div>
                            <MapViewTabs />
                        </div>
                    </main>
                    <ActionBar />
                </div>
            </CreatePatioProvider>
        </MapProvider>
    );
};
