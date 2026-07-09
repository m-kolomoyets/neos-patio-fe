import type { WithClassName } from '@/lib/types';
import type { PatioBounds } from '@/services/patios/types';
import type { MapInteraction } from './utils/sceneBootstrap';
import { useEffect, useRef } from 'react';
import { useRegisterCesiumViewer } from '@/contexts/CesiumViewerContext';
import { usePageTransition } from '@/contexts/PageTransitionContext';
import { applyInteractionMode, bootstrapScene, configureViewer } from './utils/sceneBootstrap';
import s from './styles.module.css';

import 'cesium/Build/Cesium/Widgets/widgets.css';

import clsx from 'clsx';

type CesiumMapProps = WithClassName<{
    bounds: PatioBounds;
    /**
     * How the camera may be driven. `'edit'` (default) preserves the editor's
     * free controller; `'view'` constrains it to orbit + zoom around the framed
     * patio so the camera can never fly away.
     */
    interaction?: MapInteraction;
}>;

/**
 * Hosts the single Cesium {@link Viewer}: creates it imperatively against the
 * container ref, registers it for overlay widgets via the CesiumViewerProvider,
 * loads the Google Photorealistic 3D Tiles world, frames the patio bounds,
 * applies the `interaction` camera constraints, and tears the Viewer down on
 * unmount. Shared by the editor and view routes.
 */
export const CesiumMap: React.FC<CesiumMapProps> = ({ className, bounds, interaction = 'edit' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const registerViewer = useRegisterCesiumViewer();
    const { finish } = usePageTransition();

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const viewer = configureViewer(container);
        const teardownInteraction = applyInteractionMode(viewer, interaction, bounds);
        registerViewer(viewer);

        // Clear the loading overlay once the place is framed and its first LOD
        // has settled (or after the bootstrap safety timeout).
        const teardownScene = bootstrapScene(viewer, bounds, { onReady: finish });

        return () => {
            teardownInteraction();
            teardownScene();
            registerViewer(null);
            if (!viewer.isDestroyed()) {
                viewer.destroy();
            }
        };
    }, [bounds, interaction, registerViewer, finish]);

    return (
        <div className={clsx(s.wrap, className)}>
            <div ref={containerRef} className={s.map} />
        </div>
    );
};
