import type { WithClassName } from '@/lib/types';
import type { PatioBounds } from '@/services/patios/types';
import type { MapInteraction } from './utils/sceneBootstrap';
import { useEffect, useRef } from 'react';
import {
    useRegisterCesiumViewer,
    useSetCesiumGroundHeight,
    useSetCesiumMapReady,
} from '@/contexts/CesiumViewerContext';
import { usePageTransition } from '@/contexts/PageTransitionContext';
import { useGroundFloor } from '@/hooks/useGroundFloor';
import { applyInteractionMode, bootstrapScene, configureViewer } from './utils/sceneBootstrap';
import s from './styles.module.css';

import 'cesium/Build/Cesium/Widgets/widgets.css';

import clsx from 'clsx';

type CesiumMapProps = WithClassName<{
    bounds: PatioBounds;
    /**
     * The patio's authored look-at offset above ground (`Patio.height`). Folded
     * into the final framing so the camera aims at the patio's focal point
     * instead of a spot under the tileset mesh. Defaults to `0` (ground plane).
     */
    height?: number;
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
export const CesiumMap: React.FC<CesiumMapProps> = ({ className, bounds, height = 0, interaction = 'edit' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const registerViewer = useRegisterCesiumViewer();
    const setReady = useSetCesiumMapReady();
    const setGroundHeight = useSetCesiumGroundHeight();
    const { finish } = usePageTransition();

    // Keep the free (edit-mode) camera above the tileset surface; view mode does
    // its own ground clamp inside the orbit controls.
    useGroundFloor(bounds, interaction === 'edit');

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const viewer = configureViewer(container);
        const teardownInteraction = applyInteractionMode(viewer, interaction, bounds);
        registerViewer(viewer);

        // Flag the scene ready once the place is framed and its first LOD has
        // settled (or after the bootstrap safety timeout). Camera-driving widgets
        // (idle orbit) gate on `ready` so they never start while the camera is
        // still at the default whole-earth view.
        //
        // Overlay ownership: the editor route clears the overlay here on ready.
        // The view route does NOT — Patio View gates the reveal on map-ready AND
        // its placed models finishing, so the scene is complete on first paint.
        const teardownScene = bootstrapScene(viewer, bounds, {
            height,
            onGroundHeight: setGroundHeight,
            onReady: () => {
                if (interaction !== 'view') {
                    finish();
                }
                setReady(true);
            },
        });

        return () => {
            teardownInteraction();
            teardownScene();
            setReady(false);
            setGroundHeight(null);
            registerViewer(null);
            if (!viewer.isDestroyed()) {
                viewer.destroy();
            }
        };
    }, [bounds, height, interaction, registerViewer, setReady, setGroundHeight, finish]);

    return (
        <div className={clsx(s.wrap, className)}>
            <div ref={containerRef} className={s.map} />
        </div>
    );
};
