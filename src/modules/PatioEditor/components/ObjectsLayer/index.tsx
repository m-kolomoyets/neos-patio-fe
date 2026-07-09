import type { ObjectModelHandle } from './components/ObjectModel';
import { useEffect, useRef, useState } from 'react';
import { useCesiumViewer } from '@/contexts/CesiumViewerContext';
import { useModelsQuery } from '@/services/models/queries';
import { useEditorState } from '../../context/EditorContext';
import { useObjectSelection } from './hooks/useObjectSelection';
import { useTransformGizmo } from './hooks/useTransformGizmo';
import { DragReadout } from './components/DragReadout';
import { createObjectModel } from './components/ObjectModel';

/**
 * Imperatively syncs the editor's placed objects into the Cesium scene as native
 * {@link createObjectModel} primitives: it diffs the objects array against a
 * handle registry each change — creating new models, updating moved/transformed
 * ones, destroying removed ones — and requests a render so the change shows under
 * `requestRenderMode`. Its only DOM is the {@link DragReadout} badge, shown
 * over the map during an active rotate drag.
 */
export const ObjectsLayer: React.FC = () => {
    const viewer = useCesiumViewer();
    const { objects, selectedId } = useEditorState();
    const { data: models } = useModelsQuery();
    const handlesRef = useRef<Map<string, ObjectModelHandle>>(new Map());
    // Bumped each time an async model resolves, so the gizmo can attach once its
    // target model exists.
    const [readyVersion, setReadyVersion] = useState(0);

    useObjectSelection();
    const dragReadout = useTransformGizmo({ handlesRef, readyVersion });

    useEffect(() => {
        if (!viewer || !models) return;

        const { scene } = viewer;
        const handles = handlesRef.current;
        const requestRender = () => {
            if (!viewer.isDestroyed()) scene.requestRender();
        };
        const onModelReady = () => {
            requestRender();
            setReadyVersion((v) => {
                return v + 1;
            });
        };
        const gltfByModelId = new Map(
            models.map((m) => {
                return [m.id, m.gltfUrl];
            })
        );
        const live = new Set<string>();

        for (const object of objects) {
            live.add(object.id);
            const existing = handles.get(object.id);
            if (existing) {
                existing.update(object);
                existing.setSelected(object.id === selectedId);
                continue;
            }
            const gltfUrl = gltfByModelId.get(object.modelId);
            if (!gltfUrl) continue;
            const handle = createObjectModel(scene, object, gltfUrl, onModelReady);
            handle.setSelected(object.id === selectedId);
            handles.set(object.id, handle);
        }

        for (const [id, handle] of handles) {
            if (!live.has(id)) {
                handle.destroy();
                handles.delete(id);
            }
        }

        requestRender();
    }, [viewer, objects, models, selectedId]);

    // Destroy every model when the layer unmounts.
    useEffect(() => {
        const handles = handlesRef.current;
        return () => {
            for (const handle of handles.values()) {
                handle.destroy();
            }
            handles.clear();
        };
    }, []);

    if (!viewer) return null;

    return <DragReadout viewer={viewer} readout={dragReadout} />;
};
