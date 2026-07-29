import { GRID } from '../../../../constants';
import { useGridDriver } from '../../hooks/useGridDriver';

/**
 * The create-mode reference grid: a lattice of 100×100 m cells whose center cell
 * coincides with the center square, radially faded toward the viewport edges.
 * Its own component so `useGridDriver` (a per-frame map `render` subscription)
 * mounts only in create mode — view mode never pays for it.
 *
 * Painted before every square so they sit on top of it, and it inherits the
 * overlay's `--crossfade-opacity` so it fades in/out with them.
 */
export const GridPath: React.FC = () => {
    const registerGrid = useGridDriver();

    return (
        <path
            ref={registerGrid}
            fill="none"
            stroke={GRID.lineColor}
            strokeWidth={GRID.lineWidth}
            strokeOpacity={GRID.opacity}
            mask="url(#grid-fade)"
        />
    );
};
