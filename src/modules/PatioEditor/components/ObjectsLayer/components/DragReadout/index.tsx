import type { EditorMode } from '../../../../types';
import type { DragReadoutProps } from './types';
import AngleIcon from '@/icons/angle_24.svg?react';
import RulerIcon from '@/icons/ruler_24.svg?react';
import { Cartesian2, SceneTransforms } from 'cesium';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

/** Leading icon per transform mode — rotate shows an angle, translate a ruler. */
const READOUT_ICONS: Partial<Record<EditorMode, React.FC<React.SVGProps<SVGSVGElement>>>> = {
    rotate: AngleIcon,
    translate: RulerIcon,
};

/**
 * Floating badge shown next to the gizmo while a drag readout is active. Projects
 * the world-space readout origin to window coordinates each render (the origin is
 * fixed during a drag, but the label updates every move) and pins an
 * absolutely-positioned badge near it. Renders nothing when no readout is active or
 * the origin projects off-screen. `pointer-events: none` so it never intercepts the
 * drag. Mode-agnostic: the caller hands it a pre-formatted label (degrees, metres,
 * …); this component only places and paints the pill.
 */
export const DragReadout: React.FC<DragReadoutProps> = ({ viewer, readout }) => {
    if (!readout) return null;

    const window = SceneTransforms.worldToWindowCoordinates(viewer.scene, readout.origin, new Cartesian2());
    if (!window) return null;

    // worldToWindowCoordinates is canvas-relative CSS px; offset by the canvas
    // rect so the badge can be positioned in the viewport with `position: fixed`.
    const rect = viewer.scene.canvas.getBoundingClientRect();
    const Icon = READOUT_ICONS[readout.mode];

    return (
        <Typography
            variant="text-sm"
            className={s.badge}
            style={{ left: rect.left + window.x, top: rect.top + window.y }}
        >
            {Icon && <Icon className={s.icon} aria-hidden />}
            {readout.label}
        </Typography>
    );
};
