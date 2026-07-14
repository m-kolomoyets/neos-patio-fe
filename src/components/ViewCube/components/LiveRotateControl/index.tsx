import type { CameraState, CameraTarget } from '../../types';
import { useCallback } from 'react';
import { ROTATE_STEP_DEG } from '../../constants';
import { RotateControl } from './components/RotateControl';

type LiveRotateControlProps = {
    readOrientation: () => CameraState;
    /** Animated bearing move (free rotate when not flattened). */
    easeTo: (_target: CameraTarget) => void;
    /** Whether the cube is in the flattened "selected face" state. */
    isFlattened: boolean;
    /** Step a quarter-turn to the neighbor face (+1 right, -1 left) while flattened. */
    stepBy: (_dir: 1 | -1) => void;
};

/**
 * Live-rotate leaf: the `↺ ↻` quarter-turn buttons under the cube.
 *
 * Renders nothing camera-derived, so — unlike {@link LiveZoomControl} — it holds
 * no per-frame subscription; the handlers read the live bearing on click. When
 * the cube is flattened to a side face, a press steps the neighbor face (via
 * {@link stepBy}, which snaps + keeps the patio framed); otherwise it eases the
 * bearing ±{@link ROTATE_STEP_DEG}, leaving pitch/range untouched.
 */
export const LiveRotateControl: React.FC<LiveRotateControlProps> = ({
    readOrientation,
    easeTo,
    isFlattened,
    stepBy,
}) => {
    const onRotateLeft = useCallback(() => {
        if (isFlattened) {
            stepBy(-1);
            return;
        }
        easeTo({ bearing: readOrientation().bearing - ROTATE_STEP_DEG });
    }, [isFlattened, stepBy, easeTo, readOrientation]);

    const onRotateRight = useCallback(() => {
        if (isFlattened) {
            stepBy(1);
            return;
        }
        easeTo({ bearing: readOrientation().bearing + ROTATE_STEP_DEG });
    }, [isFlattened, stepBy, easeTo, readOrientation]);

    return <RotateControl onRotateLeft={onRotateLeft} onRotateRight={onRotateRight} />;
};
