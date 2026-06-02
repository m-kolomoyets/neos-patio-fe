import type { MapRef } from 'react-map-gl/maplibre';
import type { CubeCorner, CubeFace } from '../../types';
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

/** Corner hit targets pinned to the top face (full 3D corner geometry lands in #03). */
const CORNERS: { corner: CubeCorner; className: string }[] = [
    { corner: 'northwest', className: s['corner-nw'] },
    { corner: 'northeast', className: s['corner-ne'] },
    { corner: 'southwest', className: s['corner-sw'] },
    { corner: 'southeast', className: s['corner-se'] },
];

/**
 * Live 3D cube leaf, isolated so only it re-renders per map frame.
 *
 * Subscribes to the camera via {@link useCameraState} and mirrors its
 * orientation onto the CSS cube (`rotateX(pitch) rotateZ(-bearing)`). Faces and
 * corner targets carry `data-face` for the parent's hover + pointer gesture
 * wiring. No three.js / GL — pure DOM + CSS transforms.
 */
export const CubeView: React.FC<{ map: MapRef }> = ({ map }) => {
    const camera = useCameraState(map);

    return (
        <div className={s.cube} style={{ transform: cubeTransform(camera) }}>
            {FACES.map(({ face, label, className }) => {
                return (
                    <div key={face} className={`${s.face} ${className}`} data-face={face}>
                        <span className={s.label}>{label}</span>
                        {/* Corner targets ride on the top face; full 3D corners land in #03. */}
                        {face === 'top' &&
                            CORNERS.map(({ corner, className: cornerClass }) => {
                                return <div key={corner} className={`${s.corner} ${cornerClass}`} data-face={corner} />;
                            })}
                    </div>
                );
            })}
            {/* Bottom face is never seen; rendered so the cube reads as solid when tilted. */}
            <div className={clsx(s.face, s['face-bottom'])} />
        </div>
    );
};
