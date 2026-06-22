import type { PatioBounds } from '@/services/patios/types';
import { useEffect, useRef } from 'react';
import { usePageTransition } from '@/contexts/PageTransitionContext';
import { bootstrapScene, configureViewer } from './utils/sceneBootstrap';
import { useRegisterCesiumViewer } from '../../context/CesiumViewerContext';

import 'cesium/Build/Cesium/Widgets/widgets.css';

import s from './styles.module.css';

type MapCanvasProps = {
    bounds: PatioBounds;
};

/**
 * Hosts the single Cesium {@link Viewer}: creates it imperatively against the
 * container ref, registers it for overlay widgets via the CesiumViewerProvider,
 * loads the Google Photorealistic 3D Tiles world, frames the patio bounds, and
 * tears the Viewer down on unmount.
 */
export const MapCanvas: React.FC<MapCanvasProps> = ({ bounds }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const registerViewer = useRegisterCesiumViewer();
    const { finish } = usePageTransition();

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const viewer = configureViewer(container);
        registerViewer(viewer);

        // Clear the loading overlay once the place is framed and its first LOD
        // has settled (or after the bootstrap safety timeout).
        const teardownScene = bootstrapScene(viewer, bounds, { onReady: finish });

        return () => {
            teardownScene();
            registerViewer(null);
            if (!viewer.isDestroyed()) {
                viewer.destroy();
            }
        };
    }, [bounds, registerViewer, finish]);

    return (
        <div className={s.wrap}>
            <div ref={containerRef} className={s.map} />
        </div>
    );
};
