import type { Object3D } from 'three';
import type { TransformControls as TransformControlsImpl } from 'three-stdlib';
import type { PlacedObject } from '@/services/patios/types';
import { useEffect, useMemo, useState } from 'react';
import { TransformControls, useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useMap } from 'react-three-map/maplibre';
import { Box3, Matrix4, Vector3 } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useEditorDispatch, useEditorState } from '../../../../context/EditorContext';
import { EDITOR_MODEL_USERDATA_KEY, EDITOR_OBJECT_USERDATA_KEY } from '../SelectionRaycaster';

type ObjectMeshProps = {
    object: PlacedObject;
    gltfUrl: string;
};

const setMapInteractions = (map: maplibregl.Map, enabled: boolean) => {
    const handlers = [
        map.dragPan,
        map.scrollZoom,
        map.dragRotate,
        map.touchZoomRotate,
        map.doubleClickZoom,
        map.keyboard,
    ];
    handlers.forEach((h) => {
        if (enabled) h.enable();
        else h.disable();
    });
};

type ObjectChangeListener = () => void;

type ObjectChangeEmitter = {
    addEventListener: (_type: 'objectChange', _listener: ObjectChangeListener) => void;
    removeEventListener: (_type: 'objectChange', _listener: ObjectChangeListener) => void;
};

export const ObjectMesh: React.FC<ObjectMeshProps> = ({ object, gltfUrl }) => {
    const dispatch = useEditorDispatch();
    const { selectedId, mode } = useEditorState();
    const map = useMap();
    const invalidate = useThree((s) => {
        return s.invalidate;
    });
    const { scene } = useGLTF(gltfUrl);
    const cloned = useMemo(() => {
        const model = SkeletonUtils.clone(scene);
        model.userData[EDITOR_MODEL_USERDATA_KEY] = object.id;
        return model;
    }, [scene, object.id]);
    const baseOffsetY = useMemo(() => {
        const box = new Box3().setFromObject(cloned);
        return -box.min.y;
    }, [cloned]);
    const [target, setTarget] = useState<Object3D | null>(null);
    const [controls, setControls] = useState<TransformControlsImpl | null>(null);
    const isSelected = selectedId === object.id;
    const mapCanvas = map.getCanvas();

    useEffect(() => {
        if (!controls) return;
        // react-three-map overrides camera.projectionMatrix via projByView, so the standard
        // raycaster.setFromCamera computes a ray that doesn't match the rendered projection.
        // Patch the controls' raycaster to use projByViewInv stored in camera.userData.
        const raycaster = (controls as unknown as { raycaster: import('three').Raycaster }).raycaster;
        const inv = new Matrix4();
        const origin = new Vector3();
        const dir = new Vector3();
        // eslint-disable-next-line react-hooks/immutability
        raycaster.setFromCamera = (ndc, cam) => {
            const arr = (cam.userData as { projByViewInv?: number[] }).projByViewInv;
            if (!arr) return;
            inv.fromArray(arr);
            origin.set(0, 0, 0).applyMatrix4(inv);
            dir.set(ndc.x, ndc.y, 1).applyMatrix4(inv).sub(origin).normalize();
            raycaster.ray.origin.copy(origin);
            raycaster.ray.direction.copy(dir);
            raycaster.camera = cam;
        };
    }, [controls]);

    // useEffect(() => {
    //     if (!controls) return;
    //     const applyTopMost = () => {
    //         controls.traverse((obj) => {
    //             const mesh = obj as Mesh;
    //             const mat = mesh.material as (Material & { visible?: boolean }) | undefined;
    //             if (!mat || Array.isArray(mat)) return;
    //             if (mat.visible === false) return;
    //             mat.depthTest = false;
    //             mat.depthWrite = false;
    //             mat.transparent = true;
    //             mesh.renderOrder = 999;
    //         });
    //     };
    //     applyTopMost();
    //     controls.addEventListener('change', applyTopMost);
    //     return () => {
    //         controls.removeEventListener('change', applyTopMost);
    //     };
    // }, [controls, mode]);

    useEffect(() => {
        if (!isSelected) return;
        setMapInteractions(map, false);
        return () => {
            setMapInteractions(map, true);
        };
    }, [isSelected, map]);

    // The contour outline (SelectionOutline) reads the live scene each render, so
    // dragging the transform gizmo must keep the demand loop alive — invalidate on
    // every objectChange so the outline tracks the moving object.
    useEffect(() => {
        if (!isSelected) return;
        invalidate();
        const onObjectChange = () => {
            invalidate();
        };
        const events = controls as unknown as ObjectChangeEmitter | null;
        events?.addEventListener('objectChange', onObjectChange);
        return () => {
            events?.removeEventListener('objectChange', onObjectChange);
        };
    }, [isSelected, controls, invalidate]);

    return (
        <>
            <group
                ref={setTarget}
                position={[object.x, object.y, object.z]}
                scale={object.scale}
                rotation={[object.rotX, object.rotY, object.rotZ]}
                userData={{ [EDITOR_OBJECT_USERDATA_KEY]: object.id }}
            >
                <primitive object={cloned} position={[0, baseOffsetY, 0]} />
            </group>
            {isSelected && target && (
                <TransformControls
                    ref={setControls}
                    object={target}
                    domElement={mapCanvas}
                    enabled={isSelected}
                    mode={mode}
                    showX
                    showY={mode !== 'scale'}
                    showZ={mode !== 'scale'}
                    onMouseUp={() => {
                        dispatch({
                            type: 'transform',
                            id: object.id,
                            patch: {
                                x: target.position.x,
                                y: target.position.y,
                                z: target.position.z,
                                rotX: target.rotation.x,
                                rotY: target.rotation.y,
                                rotZ: target.rotation.z,
                                scale: target.scale.x,
                            },
                        });
                    }}
                    onObjectChange={() => {
                        if (mode !== 'scale') return;
                        const s = target.scale.x;
                        target.scale.set(s, s, s);
                    }}
                />
            )}
        </>
    );
};
