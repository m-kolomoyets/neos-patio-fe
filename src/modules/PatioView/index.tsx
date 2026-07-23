import type { PatioBounds } from '@/services/patios/types';
import { useEffect } from 'react';
import { CesiumViewerProvider } from '@/contexts/CesiumViewerContext';
import { usePageTransition } from '@/contexts/PageTransitionContext';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getAppBackground } from '@/lib/appBackground';
import { useIdleRotation } from '@/hooks/useIdleRotation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useIsMobileLandscape } from '@/hooks/useIsMobileLandscape';
import { useSquircleClipPath } from '@/hooks/useSquircleClipPath';
import { getPatioQueryOptions } from '@/services/patios/queries';
import { ActionBar } from '@/components/ActionBar';
import { AppBackground } from '@/components/AppBackground';
import { CesiumMap } from '@/components/CesiumMap';
import { ViewCube } from '@/components/ViewCube';
import { usePatioViewParams } from './hooks/usePatioViewRouteApi';
import { Header } from './components/Header';
import s from './styles.module.css';

// Inherits the background the previous screen picked (persisted). No re-roll.
const patioViewBackgroundSrc = getAppBackground();

/** Drives the ambient idle-orbit; renders nothing. Must live inside CesiumViewerProvider. */
const IdleOrbit: React.FC<{ bounds: PatioBounds }> = ({ bounds }) => {
    useIdleRotation(bounds);
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
                            <ViewCube className={s['view-cube']} bounds={patio.bounds} storageId={id} />
                            <IdleOrbit bounds={patio.bounds} />
                        </CesiumViewerProvider>
                    </div>
                </div>
            </main>
            <ActionBar />
        </div>
    );
};
