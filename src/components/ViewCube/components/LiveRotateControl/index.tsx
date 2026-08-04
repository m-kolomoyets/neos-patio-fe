import type { LiveRotateControlProps } from './types';
import { useCallback } from 'react';
import { ROTATE_STEP_DEG } from '../../constants';
import { RotateControl } from './components/RotateControl';

/**
 * Live-rotate leaf: the `↺ ↻` quarter-turn buttons under the cube.
 *
 * Renders nothing camera-derived, so — unlike {@link LiveZoomControl} — it holds
 * no per-frame subscription; the handlers read the live bearing on click. When
 * the cube is flattened to a side face, a press steps the neighbor face (via
 * {@link stepBy}, which snaps + keeps the patio framed); otherwise it orbits the
 * bearing ±{@link ROTATE_STEP_DEG} via {@link snapTo} — the same smooth in-place
 * quarter-turn a cube face click makes (no fly-arc), pitch untouched and range
 * pulled in only if the current zoom would reveal out-of-bounds.
 */
export const LiveRotateControl: React.FC<LiveRotateControlProps> = ({
    readOrientation,
    snapTo,
    isFlattened,
    stepBy,
}) => {
    const onRotateLeft = useCallback(() => {
        if (isFlattened) {
            stepBy(-1);
            return;
        }
        snapTo({ bearing: readOrientation().bearing - ROTATE_STEP_DEG });
    }, [isFlattened, stepBy, snapTo, readOrientation]);

    const onRotateRight = useCallback(() => {
        if (isFlattened) {
            stepBy(1);
            return;
        }
        snapTo({ bearing: readOrientation().bearing + ROTATE_STEP_DEG });
    }, [isFlattened, stepBy, snapTo, readOrientation]);

    return <RotateControl onRotateLeft={onRotateLeft} onRotateRight={onRotateRight} />;
};
