import type { PatioBounds, PlacedObject } from '@/services/patios/types';
import { useEffect, useRef } from 'react';
import { useCesiumViewer } from '@/contexts/CesiumViewerContext';
import { useModelsQuery } from '@/services/models/queries';
import { loadObjectBatch } from './utils/loadObjectBatch';
import { planObjectLoads } from './utils/planObjectLoads';

type ViewObjectsLayerProps = {
    objects: PlacedObject[];
    bounds: PatioBounds;
    /**
     * Fired once the placed-model batch settles — every model loaded or
     * failed — or immediately when the patio has no objects. Patio View gates
     * its reveal on this so the scene is complete before the overlay clears.
     */
    onLoaded?: () => void;
};

/**
 * Read-only objects layer for Patio View: renders the patio's placed models as
 * decoration. Independent of the editor (no selection, gizmo, or editor context);
 * models are non-interactive (no pick id, no silhouette). Resolves each object to
 * its glTF URL via {@link planObjectLoads}, seats it with the shared
 * {@link createObjectModel} primitive owner, and destroys every primitive on
 * unmount so navigating away leaks no Cesium models. Renders nothing to the DOM.
 */
export const ViewObjectsLayer: React.FC<ViewObjectsLayerProps> = ({ objects, bounds, onLoaded }) => {
    const viewer = useCesiumViewer();
    const { data: models } = useModelsQuery();

    // Held in a ref so a new `onLoaded` identity never re-runs the batch effect.
    const onLoadedRef = useRef(onLoaded);
    useEffect(
        function syncOnLoadedRef() {
            onLoadedRef.current = onLoaded;
        },
        [onLoaded]
    );

    useEffect(
        function seatViewObjects() {
            if (!viewer || !models) {
                return undefined;
            }

            const { scene } = viewer;
            const requestRender = () => {
                if (!viewer.isDestroyed()) {
                    scene.requestRender();
                }
            };

            const { loads } = planObjectLoads(objects, models, bounds);

            if (import.meta.env.DEV) {
                for (const load of loads) {
                    if (load.outOfBounds) {
                        // eslint-disable-next-line no-console
                        console.warn(
                            `[ViewObjectsLayer] Object "${load.object.name}" (${load.object.id}) at ` +
                                `lng ${load.object.lng}, lat ${load.object.lat} is outside patio bounds ` +
                                `[${bounds.join(', ')}]. Rendered as authored — check the fixture.`
                        );
                    }
                }
            }
            const batch = loadObjectBatch(scene, loads, requestRender);

            // Signal reveal once the batch settles (or right away for an empty
            // patio, since `done` resolves synchronously). Guarded so teardown
            // before settle never fires it.
            let settled = false;
            void batch.done.then(function signalLoaded() {
                if (!settled) {
                    settled = true;
                    onLoadedRef.current?.();
                }
            });

            return function teardown() {
                settled = true;
                batch.destroy();
            };
        },
        [viewer, models, objects, bounds]
    );

    return null;
};
