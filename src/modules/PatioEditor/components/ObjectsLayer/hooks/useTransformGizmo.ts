import type { Cartesian3 } from 'cesium';
import type { PatioBounds } from '@/services/patios/types';
import type { ObjectModelHandle } from '../components/ObjectModel';
import type { GizmoAxis } from '../gizmo/types';
import { useEffect, useState } from 'react';
import { Cartesian3 as Cartesian3Ctor, Matrix4 } from 'cesium';
// `sampleSurfaceHeight` re-added when release regrounding is re-enabled below.
import { clampToBounds, modelMatrixToGeoPose } from '../../../utils/geoPlacement';
import { useCesiumViewer } from '../../../context/CesiumViewerContext';
import { useEditorDispatch, useEditorState } from '../../../context/EditorContext';
import { createTransformGizmo } from '../gizmo/transformGizmo';

type UseTransformGizmoArgs = {
    handlesRef: React.RefObject<Map<string, ObjectModelHandle>>;
    /** Bumped whenever a model finishes loading, so the gizmo can attach once ready. */
    readyVersion: number;
};

/** Live rotate-drag feedback the layer needs to render the on-screen angle badge. */
export type RotationReadout = {
    /** Signed cumulative angle in whole degrees, as swept about the grabbed axis. */
    degrees: number;
    /** World-space gizmo origin, projected to screen to place the badge. */
    origin: Cartesian3;
};

/**
 * Attaches the custom {@link createTransformGizmo} to the currently-selected
 * object's live Cesium model, in the active transform mode. Live drag mutates the
 * model's `modelMatrix` for smooth feedback (`requestRender` each step under
 * `requestRenderMode`); on drag-end the matrix is read back into a geographic +
 * HPR patch and committed as exactly one history entry. In translate mode a
 * horizontal (east/north) drag re-grounds the object to the real surface and
 * clamps it to the patio bounds, a vertical (up) drag keeps the manually set
 * height; in rotate mode the dragged orientation round-trips into
 * heading/pitch/roll. The gizmo is recreated when the selection, mode, or
 * readiness changes, and torn down when nothing is selected.
 */
export const useTransformGizmo = ({ handlesRef, readyVersion }: UseTransformGizmoArgs): RotationReadout | null => {
    const viewer = useCesiumViewer();
    const { selectedId, mode, bounds } = useEditorState();
    const dispatch = useEditorDispatch();
    // Non-null only during an active rotate drag; drives the badge in ObjectsLayer.
    const [rotation, setRotation] = useState<RotationReadout | null>(null);

    useEffect(() => {
        if (!viewer || !selectedId) return;

        const model = handlesRef.current.get(selectedId)?.getModel();
        if (!model) return;

        const { scene } = viewer;
        const requestRender = () => {
            if (!viewer.isDestroyed()) scene.requestRender();
        };

        // Read the rotate-dragged matrix back into a heading/pitch/roll patch via
        // the existing decompose path, committing one history entry.
        const commitRotate = () => {
            const { heading, pitch, roll } = modelMatrixToGeoPose(model.modelMatrix);
            dispatch({ type: 'transform', id: selectedId, patch: { heading, pitch, roll } });
            requestRender();
        };

        // Read the scale-dragged matrix back into the single uniform `scale` field
        // via the existing decompose path, committing one history entry.
        const commitScale = () => {
            const { scale } = modelMatrixToGeoPose(model.modelMatrix);
            dispatch({ type: 'transform', id: selectedId, patch: { scale } });
            requestRender();
        };

        const commitTranslate = (_axis: GizmoAxis, currentBounds: PatioBounds) => {
            const pose = modelMatrixToGeoPose(model.modelMatrix);
            const { lng, lat } = clampToBounds(currentBounds, pose);

            // Regrounding on release is disabled for now — commit the dragged
            // height as-is (clamped lng/lat only).
            dispatch({ type: 'transform', id: selectedId, patch: { lng, lat, height: pose.height } });
            requestRender();

            // Horizontal drag reground (re-enable later): for a non-vertical axis,
            // sample the most detailed tiles (excluding the model's own mesh) and
            // commit that surface height instead of the dragged one.
            // if (_axis !== 'z') {
            //     void sampleSurfaceHeight(scene, lng, lat, [model]).then((height) => {
            //         dispatch({
            //             type: 'transform',
            //             id: selectedId,
            //             patch: { lng, lat, height: height ?? pose.height },
            //         });
            //         requestRender();
            //     });
            // }
        };

        const gizmo = createTransformGizmo({
            scene,
            target: model,
            mode,
            onDragMove: requestRender,
            onDragEnd: (axis) => {
                if (mode === 'rotate') return commitRotate();
                if (mode === 'scale') return commitScale();
                return commitTranslate(axis, bounds);
            },
            onRotateStart: () => {
                const origin = Matrix4.getTranslation(model.modelMatrix, new Cartesian3Ctor());
                setRotation({ degrees: 0, origin });
            },
            onRotateUpdate: (degrees) => {
                setRotation((prev) => {
                    return prev ? { ...prev, degrees } : prev;
                });
            },
            onRotateEnd: () => {
                return setRotation(null);
            },
        });
        requestRender();

        return () => {
            gizmo.destroy();
            // Tear down any in-flight readout if the gizmo is recreated/removed mid-drag.
            setRotation(null);
            requestRender();
        };
    }, [viewer, selectedId, mode, bounds, dispatch, handlesRef, readyVersion]);

    return rotation;
};
