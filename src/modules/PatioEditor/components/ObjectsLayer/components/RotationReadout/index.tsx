import type { RotationReadoutProps } from './types';
import { Cartesian2, SceneTransforms } from 'cesium';
import s from './styles.module.css';

/** `+20°` / `-45°` / `0°` — sign only on a non-zero turn. */
const formatDegrees = (degrees: number): string => {
    const sign = degrees > 0 ? '+' : '';
    return `${sign}${degrees}°`;
};

/**
 * Floating degree badge shown next to the gizmo while a rotation ring is dragged.
 * Projects the world-space gizmo origin to window coordinates each render (the
 * origin is fixed during a rotate drag, but degrees update every move) and pins an
 * absolutely-positioned badge near it. Renders nothing when no rotate drag is
 * active or the origin projects off-screen. `pointer-events: none` so it never
 * intercepts the drag.
 */
export const RotationReadout: React.FC<RotationReadoutProps> = ({ viewer, readout }) => {
    if (!readout) return null;

    const window = SceneTransforms.worldToWindowCoordinates(viewer.scene, readout.origin, new Cartesian2());
    if (!window) return null;

    // worldToWindowCoordinates is canvas-relative CSS px; offset by the canvas
    // rect so the badge can be positioned in the viewport with `position: fixed`.
    const rect = viewer.scene.canvas.getBoundingClientRect();

    return (
        <div className={s.badge} style={{ left: rect.left + window.x, top: rect.top + window.y }}>
            {formatDegrees(readout.degrees)}
        </div>
    );
};
