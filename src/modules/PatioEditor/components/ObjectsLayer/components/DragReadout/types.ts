import type { Viewer } from 'cesium';
import type { DragReadout as DragReadoutValue } from '../../hooks/useTransformGizmo';

export type DragReadoutProps = {
    /** Live viewer, used to project the readout origin to screen coordinates. */
    viewer: Viewer;
    /** Current drag readout, or `null` when no drag readout is active. */
    readout: DragReadoutValue | null;
};
