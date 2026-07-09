import type { Cartesian3 } from 'cesium';
import type { PatioBounds } from '@/services/patios/types';
import type { EditorMode } from '../../../types';
import type { ObjectModelHandle } from '../components/ObjectModel';
import type { GizmoAxis } from '../gizmo/types';
import { useEffect, useState } from 'react';
import { useCesiumViewer } from '@/contexts/CesiumViewerContext';
import { Cartesian3 as Cartesian3Ctor, Matrix4 } from 'cesium';
import { clampToBounds, modelMatrixToGeoPose } from '../../../utils/geoPlacement';
import { useEditorDispatch, useEditorState } from '../../../context/EditorContext';
// `sampleSurfaceHeight` re-added when release regrounding is re-enabled below.
import { formatDistance } from '../gizmo/dragMath';
import { createTransformGizmo } from '../gizmo/transformGizmo';

type UseTransformGizmoArgs = {
    handlesRef: React.RefObject<Map<string, ObjectModelHandle>>;
    /** Bumped whenever a model finishes loading, so the gizmo can attach once ready. */
    readyVersion: number;
};

/** Live drag feedback the layer needs to render the on-screen readout badge. */
export type DragReadout = {
    /** Pre-formatted badge text (e.g. `+20°`), built per mode by the hook. */
    label: string;
    /** World-space readout origin, projected to screen to place the badge. */
    origin: Cartesian3;
    /** Active transform mode — drives which leading icon the badge shows. */
    mode: EditorMode;
};

/** `+20°` / `-45°` / `0°` — sign only on a non-zero turn. */
const formatDegrees = (degrees: number): string => {
    const sign = degrees > 0 ? '+' : '';
    return `${sign}${degrees}°`;
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
export const useTransformGizmo = ({ handlesRef, readyVersion }: UseTransformGizmoArgs): DragReadout | null => {
    const viewer = useCesiumViewer();
    const { selectedId, mode, bounds } = useEditorState();
    const dispatch = useEditorDispatch();
    // Non-null only during an active readout drag; drives the badge in ObjectsLayer.
    const [readout, setReadout] = useState<DragReadout | null>(null);

    useEffect(() => {
        if (!viewer || !selectedId) return;

        const model = handlesRef.current.get(selectedId)?.getModel();
        if (!model) return;

        const { scene } = viewer;
        const requestRender = () => {
            if (!viewer.isDestroyed()) scene.requestRender();
        };

        // Per-mode readout label: translate reports absolute distance (auto cm/m),
        // every other readout-firing mode (rotate) reports signed whole degrees.
        const formatReadout = (value: number): string => {
            return mode === 'translate' ? formatDistance(value) : formatDegrees(value);
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
            onReadoutStart: () => {
                const origin = Matrix4.getTranslation(model.modelMatrix, new Cartesian3Ctor());
                // Format per mode: translate reports absolute metres, rotate signed degrees.
                setReadout({ label: formatReadout(0), origin, mode });
            },
            onReadoutUpdate: (value) => {
                setReadout((prev) => {
                    return prev ? { ...prev, label: formatReadout(value) } : prev;
                });
            },
            onReadoutEnd: () => {
                return setReadout(null);
            },
        });
        requestRender();

        return () => {
            gizmo.destroy();
            // Tear down any in-flight readout if the gizmo is recreated/removed mid-drag.
            setReadout(null);
            requestRender();
        };
    }, [viewer, selectedId, mode, bounds, dispatch, handlesRef, readyVersion]);

    return readout;
};
