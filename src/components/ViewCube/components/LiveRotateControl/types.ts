import type { CameraState, CameraTarget } from '../../types';

export type LiveRotateControlProps = {
    readOrientation: () => CameraState;
    /** Smooth in-place orbit snap (free rotate when not flattened). */
    snapTo: (_target: CameraTarget) => void;
    /** Whether the cube is in the flattened "selected face" state. */
    isFlattened: boolean;
    /** Step a quarter-turn to the neighbor face (+1 right, -1 left) while flattened. */
    stepBy: (_dir: 1 | -1) => void;
};
