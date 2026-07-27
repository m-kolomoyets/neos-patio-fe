import type { PatioBounds } from '@/services/patios/types';
import { useEffect, useRef, useState } from 'react';
import { CesiumViewerProvider, useCesiumMapReady } from '@/contexts/CesiumViewerContext';
import { usePageTransition } from '@/contexts/PageTransitionContext';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getAppBackground } from '@/lib/appBackground';
import { useIdleRotation } from '@/hooks/useIdleRotation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useIsMobileLandscape } from '@/hooks/useIsMobileLandscape';
import { useSquircleClipPath } from '@/hooks/useSquircleClipPath';
import { useViewOrbitControls } from '@/hooks/useViewOrbitControls';
import { getPatioQueryOptions } from '@/services/patios/queries';
import { ActionBar } from '@/components/ActionBar';
import { AppBackground } from '@/components/AppBackground';
import { CesiumMap } from '@/components/CesiumMap';
import { ViewCube } from '@/components/ViewCube';
import { usePatioViewParams } from './hooks/usePatioViewRouteApi';
import { Header } from './components/Header';
import { ViewObjectsLayer } from './components/ViewObjectsLayer';
import s from './styles.module.css';

// Inherits the background the previous screen picked (persisted). No re-roll.
const patioViewBackgroundSrc = getAppBackground();

// Upper bound on the reveal wait. Exceeds the map's 8s bootstrap safety timeout
// so a hung / never-resolving model load can never strand the loading overlay.
const REVEAL_SAFETY_MS = 12000;

/**
 * Reveal-gate glue: clears the loading overlay only once the map is framed
 * (`ready`) AND the placed-model batch has settled. A patio with no objects
 * settles immediately, so it reveals on map-ready as before. A safety timeout
 * forces the reveal if the objects-loaded signal never arrives. Renders nothing;
 * must live inside CesiumViewerProvider. In view mode, CesiumMap no longer clears
 * the overlay itself — this owns it.
 */
const RevealGate: React.FC<{ objectsLoaded: boolean }> = ({ objectsLoaded }) => {
    const mapReady = useCesiumMapReady();
    const { finish } = usePageTransition();
    const revealedRef = useRef(false);

    useEffect(
        function revealWhenReady() {
            if (revealedRef.current) {
                return;
            }
            if (mapReady && objectsLoaded) {
                revealedRef.current = true;
                finish();
            }
        },
        [mapReady, objectsLoaded, finish]
    );

    useEffect(
        function revealSafetyTimeout() {
            const timer = setTimeout(function forceReveal() {
                if (!revealedRef.current) {
                    revealedRef.current = true;
                    finish();
                }
            }, REVEAL_SAFETY_MS);

            return function clearRevealTimer() {
                clearTimeout(timer);
            };
        },
        [finish]
    );

    return null;
};

/** Drives the ambient idle-orbit; renders nothing. Must live inside CesiumViewerProvider. */
const IdleOrbit: React.FC<{ bounds: PatioBounds }> = ({ bounds }) => {
    useIdleRotation(bounds, true);
    return null;
};

/** Drives the center-locked drag-orbit for view mode; renders nothing. Must live inside CesiumViewerProvider. */
const ViewOrbitControls: React.FC<{ bounds: PatioBounds }> = ({ bounds }) => {
    useViewOrbitControls(bounds);
    return null;
};

/**
 * Read-only Patio View: create-patio-style framed surface + app background.
 * Header on top, the shared Cesium map below in view-only mode (orbit + zoom +
 * limited pan, no free-fly) with ambient idle rotation.
 */
export const PatioView: React.FC = () => {
    const { id } = usePatioViewParams();
    const { data: patio } = useSuspenseQuery(getPatioQueryOptions(id));
    const { update } = usePageTransition();

    // Reveal is gated on the placed models settling (see RevealGate). Fired by
    // the objects layer's onLoaded; empty patios settle immediately.
    const [objectsLoaded, setObjectsLoaded] = useState(false);
    const handleObjectsLoaded = () => {
        setObjectsLoaded(true);
    };

    const isMobilePortrait = useIsMobile();
    const isMobileLandscape = useIsMobileLandscape();
    const isMobile = isMobilePortrait || isMobileLandscape;

    // Squircle corners matching Home / create-patio (40px surface, 22px map).
    const [surfaceRef, surfaceSquircleStyle] = useSquircleClipPath<HTMLElement>({ cornerRadius: isMobile ? 24 : 46 });
    const [mapRef, mapSquircleStyle] = useSquircleClipPath<HTMLDivElement>({ cornerRadius: isMobile ? 14 : 24 });

    // Fill the loading overlay with the real background + name once the patio
    // resolves. On the Home path these already match the seeded values; on a
    // deep-link they replace the bare dark fallback.
    useEffect(() => {
        update({
            backgroundUrl: patio.previewBackgroundUrl,
            backgroundLowUrl: patio.previewBackgroundLowUrl,
            name: patio.name,
        });
    }, [patio, update]);

    return (
        <div className={s.wrap}>
            <AppBackground src={patioViewBackgroundSrc} />
            <main ref={surfaceRef} className={s.surface} style={surfaceSquircleStyle}>
                <Header name={patio.name} description={patio.description} />
                <div className={s.map}>
                    <div ref={mapRef} className={s['map-clip']} style={mapSquircleStyle}>
                        <CesiumViewerProvider>
                            <CesiumMap bounds={patio.bounds} interaction="view" />
                            <ViewCube
                                className={s['view-cube']}
                                bounds={patio.bounds}
                                storageId={id}
                                interaction="view"
                            />
                            <ViewObjectsLayer
                                objects={patio.objects}
                                bounds={patio.bounds}
                                onLoaded={handleObjectsLoaded}
                            />
                            <RevealGate objectsLoaded={objectsLoaded} />
                            <ViewOrbitControls bounds={patio.bounds} />
                            <IdleOrbit bounds={patio.bounds} />
                        </CesiumViewerProvider>
                    </div>
                </div>
            </main>
            <ActionBar />
        </div>
    );
};
