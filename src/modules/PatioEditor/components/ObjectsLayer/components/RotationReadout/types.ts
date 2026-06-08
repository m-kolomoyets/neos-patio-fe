import type { Viewer } from 'cesium';
import type { RotationReadout as RotationReadoutValue } from '../../hooks/useTransformGizmo';

export type RotationReadoutProps = {
    /** Live viewer, used to project the gizmo origin to screen coordinates. */
    viewer: Viewer;
    /** Current rotate-drag readout, or `null` when no rotate drag is active. */
    readout: RotationReadoutValue | null;
};
