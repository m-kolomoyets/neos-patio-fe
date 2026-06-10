import type { Viewer } from 'cesium';
import type { CameraState, CubeFace } from '../../types';
import clsx from 'clsx';
import { cubeTransform } from '../../utils/cameraMath';
import { useCameraState } from '../../hooks/useCameraState';
import s from '../../styles.module.css';

/** Side + top faces rendered on the cube; `T` for top, cardinals for the sides. */
const FACES: { face: 'top' | CubeFace; label: string; className: string }[] = [
    { face: 'top', label: 'T', className: s['face-top'] },
    { face: 'north', label: 'N', className: s['face-north'] },
    { face: 'east', label: 'E', className: s['face-east'] },
    { face: 'south', label: 'S', className: s['face-south'] },
    { face: 'west', label: 'W', className: s['face-west'] },
];

/**
 * Live 3D cube leaf, isolated so only it re-renders per map frame.
 *
 * Subscribes to the camera via {@link useCameraState} and mirrors its
 * orientation onto the CSS cube (`rotateX(pitch) rotateZ(-bearing)`). Faces
 * carry `data-face` for the parent's hover + pointer gesture wiring. No
 * three.js / GL — pure DOM + CSS transforms.
 */
export const CubeView: React.FC<{ viewer: Viewer; readOrientation: () => CameraState }> = ({
    viewer,
    readOrientation,
}) => {
    const camera = useCameraState(viewer, readOrientation);

    return (
        <div className={s.cube} style={{ transform: cubeTransform(camera) }}>
            {FACES.map(({ face, label, className }) => {
                return (
                    <div key={face} className={`${s.face} ${className}`} data-face={face}>
                        <span className={s.label}>{label}</span>
                    </div>
                );
            })}
            {/* Bottom face is never seen; rendered so the cube reads as solid when tilted. */}
            <div className={clsx(s.face, s['face-bottom'])} />
        </div>
    );
};
