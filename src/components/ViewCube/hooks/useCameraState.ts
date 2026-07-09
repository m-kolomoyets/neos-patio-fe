import type { Viewer } from 'cesium';
import type { CameraState } from '../types';
import { useEffect, useState } from 'react';
import { DEFAULT_BEARING, DEFAULT_PITCH } from '../constants';

const INITIAL_CAMERA: CameraState = { bearing: DEFAULT_BEARING, pitch: DEFAULT_PITCH, range: 0 };

/** Sub-unit changes are visual noise; bail on re-render unless something moved. */
const EPSILON = 0.5;
const samePose = (a: CameraState, b: CameraState): boolean => {
    return (
        Math.abs(a.bearing - b.bearing) < EPSILON &&
        Math.abs(a.pitch - b.pitch) < EPSILON &&
        Math.abs(a.range - b.range) < EPSILON
    );
};

/**
 * Subscribes to the live camera `{ bearing, pitch, range }` (display units) via
 * `scene.postRender`, which fires on every rendered frame — exactly the frames
 * the camera can change under `requestRenderMode`. Idle (no renders) means no
 * updates; tile-streaming frames are absorbed by the {@link samePose} guard.
 *
 * Deliberately kept out of {@link useCesiumCamera}: only the small leaf
 * components that render the live orientation/zoom call this and re-render per
 * frame, while the ViewCube shell and its controls stay put during pan/orbit.
 * Ephemeral local state — never touches the EditorContext reducer / undo history.
 */
export const useCameraState = (viewer: Viewer | null, readOrientation: () => CameraState): CameraState => {
    const [camera, setCamera] = useState<CameraState>(INITIAL_CAMERA);

    useEffect(() => {
        if (!viewer) {
            return undefined;
        }

        const sync = () => {
            const next = readOrientation();
            setCamera((prev) => {
                return samePose(prev, next) ? prev : next;
            });
        };

        sync();
        return viewer.scene.postRender.addEventListener(sync);
    }, [viewer, readOrientation]);

    return camera;
};
