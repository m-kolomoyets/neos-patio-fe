import type { Object3D } from 'three';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useMap } from 'react-three-map/maplibre';
import { Matrix4, Raycaster, Vector3 } from 'three';
import { useEditorDispatch, useEditorState } from '../../context/EditorContext';

export const EDITOR_OBJECT_USERDATA_KEY = 'editorObjectId';

const findEditorObjectId = (obj: Object3D | null): string | null => {
    let node: Object3D | null = obj;
    while (node) {
        const id = (node.userData as Record<string, unknown>)[EDITOR_OBJECT_USERDATA_KEY];
        if (typeof id === 'string') return id;
        node = node.parent;
    }
    return null;
};

export const SelectionRaycaster: React.FC = () => {
    const map = useMap();
    const dispatch = useEditorDispatch();
    const { mode } = useEditorState();
    const scene = useThree((s) => {
        return s.scene;
    });
    const camera = useThree((s) => {
        return s.camera;
    });

    useEffect(() => {
        // Suppress selection clicks while user drags a gizmo (mode change wouldn't matter,
        // but we want to ignore clicks that fall on TransformControls geometry).
        const raycaster = new Raycaster();
        const inv = new Matrix4();
        const origin = new Vector3();
        const dir = new Vector3();

        const handle = (e: maplibregl.MapMouseEvent) => {
            const arr = (camera.userData as { projByViewInv?: number[] }).projByViewInv;
            if (!arr) return;
            const canvas = map.getCanvas();
            const rect = canvas.getBoundingClientRect();
            const ndcX = (e.point.x / rect.width) * 2 - 1;
            const ndcY = 1 - (e.point.y / rect.height) * 2;
            inv.fromArray(arr);
            origin.set(0, 0, 0).applyMatrix4(inv);
            dir.set(ndcX, ndcY, 1).applyMatrix4(inv).sub(origin).normalize();
            raycaster.ray.origin.copy(origin);
            raycaster.ray.direction.copy(dir);
            raycaster.camera = camera;

            const hits = raycaster.intersectObjects(scene.children, true);
            for (const hit of hits) {
                const id = findEditorObjectId(hit.object);
                if (id) {
                    dispatch({ type: 'select', id });
                    return;
                }
            }
            dispatch({ type: 'select', id: null });
        };

        map.on('click', handle);
        return () => {
            map.off('click', handle);
        };
    }, [map, scene, camera, dispatch, mode]);

    return null;
};
