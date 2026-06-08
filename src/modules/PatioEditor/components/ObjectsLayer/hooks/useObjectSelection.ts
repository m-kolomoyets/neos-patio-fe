import { useEffect } from 'react';
import { ScreenSpaceEventHandler, ScreenSpaceEventType } from 'cesium';
import { useCesiumViewer } from '../../../context/CesiumViewerContext';
import { useEditorDispatch } from '../../../context/EditorContext';
import { EDITOR_OBJECT_ID } from '../components/ObjectModel';

/**
 * Wires left-click selection against the Cesium scene. `scene.pick` resolves the
 * primitive under the cursor: if its pickable `id` carries an {@link EDITOR_OBJECT_ID}
 * it selects that placed object, otherwise (empty ground / world tileset) it
 * deselects. Replaces the Three.js {@link Raycaster}-based selection. Each click
 * requests a render so the silhouette change shows under `requestRenderMode`.
 */
export const useObjectSelection = (): void => {
    const viewer = useCesiumViewer();
    const dispatch = useEditorDispatch();

    useEffect(() => {
        if (!viewer) return;

        const { scene } = viewer;
        const handler = new ScreenSpaceEventHandler(scene.canvas);

        handler.setInputAction((event: ScreenSpaceEventHandler.PositionedEvent) => {
            const picked = scene.pick(event.position) as { id?: unknown } | undefined;
            const pickId = picked?.id;
            const objectId =
                pickId && typeof pickId === 'object' && EDITOR_OBJECT_ID in pickId
                    ? (pickId as Record<string, unknown>)[EDITOR_OBJECT_ID]
                    : null;

            dispatch({ type: 'select', id: typeof objectId === 'string' ? objectId : null });
            scene.requestRender();
        }, ScreenSpaceEventType.LEFT_CLICK);

        return () => {
            handler.destroy();
        };
    }, [viewer, dispatch]);
};
