import Map, { MapProvider } from 'react-map-gl/mapbox';
import { getAppBackground } from '@/lib/appBackground';
import { useSquircleClipPath } from '@/hooks/useSquircleClipPath';
import { ActionBar } from '@/components/ActionBar';
import { AppBackground } from '@/components/AppBackground';
import {
    CREATE_PATIO_MAP_ID,
    GLOBE_FOG,
    GLOBE_MIN_ZOOM,
    GLOBE_START_ZOOM,
    MAPBOX_STYLE,
    START_COORDINATE,
} from './constants';
import { hideAerialClutter } from './utils/hideAerialClutter';
import { prefersReducedMotion } from './utils/prefersReducedMotion';
import { CreatePatioProvider } from './context/CreatePatioContext';
import { useExitCreateModeOnEscape } from './hooks/useExitCreateModeOnEscape';
import { useGlobeIdleRotation } from './hooks/useGlobeIdleRotation';
import { ClusterMarkers } from './components/ClusterMarkers';
import { Header } from './components/Header';
import { MapControls } from './components/MapControls';
import { MapViewTabs } from './components/MapViewTabs';
import { NewPatioPopup } from './components/NewPatioPopup';
import { PatioClusterSource } from './components/PatioClusterSource';
import { PatioDetailsPopup } from './components/PatioDetailsPopup';
import { SatelliteLayer } from './components/SatelliteLayer';
import { ScaleBar } from './components/ScaleBar';
import { SquaresOverlay } from './components/SquaresOverlay';
import s from './styles.module.css';

import 'mapbox-gl/dist/mapbox-gl.css';

// Inherits the background Home picked (persisted). No own re-roll.
const createPatioBackgroundSrc = getAppBackground();

/**
 * The screen itself, mounted under both providers so module-level mode hooks
 * (e.g. the `Escape` exit) can read the create-patio context.
 */
const CreatePatioSurface: React.FC = () => {
    // Module-level `Escape` exit from create mode (guarded inside the hook).
    useExitCreateModeOnEscape();
    // Slow globe drift while the map is untouched — stops once zoomed past the globe.
    useGlobeIdleRotation();

    // Squircle corners matching Home (border-radius: 2.5rem = 40px).
    const [surfaceRef, surfaceSquircleStyle] = useSquircleClipPath<HTMLElement>({ cornerRadius: 40 });
    // Inner squircle clipping the map region (22px).
    const [mapRef, mapSquircleStyle] = useSquircleClipPath<HTMLDivElement>({ cornerRadius: 22 });

    return (
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
                                zoom: GLOBE_START_ZOOM,
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
                                // Bare aerial base: no roads, places, or labels.
                                hideAerialClutter(e.target);
                            }}
                        >
                            <SatelliteLayer />
                            <PatioClusterSource />
                            <ClusterMarkers />
                            <SquaresOverlay />
                        </Map>
                        <ScaleBar />
                        <MapControls />
                        {/* Bottom-right cards — the selected patio (view mode) and the
                            patio being placed (create mode). Siblings of the map (not
                            children) so they sit above the canvas and outside its pointer
                            handling; the modes are exclusive, so only one ever mounts. */}
                        <PatioDetailsPopup />
                        <NewPatioPopup />
                    </div>
                    <MapViewTabs />
                </div>
            </main>
            <ActionBar />
        </div>
    );
};

/**
 * Create-patio flow: a top-down satellite map framed in the same rounded
 * (squircle) surface Home uses. Static header on top, map fills the rest.
 * View mode is the resting state; create mode — the center square, grid, and
 * intersection paint — is an explicit, wallet-gated opt-in from the header.
 */
export const CreatePatio: React.FC = () => {
    return (
        <MapProvider>
            <CreatePatioProvider>
                <CreatePatioSurface />
            </CreatePatioProvider>
        </MapProvider>
    );
};
