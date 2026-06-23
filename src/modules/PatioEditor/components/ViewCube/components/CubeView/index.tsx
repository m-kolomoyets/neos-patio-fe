import type { Viewer } from 'cesium';
import type { CameraState, CubeTarget } from '../../types';
import type { FaceId } from '../../utils/faceGrid';
import { useState } from 'react';
import clsx from 'clsx';
import { cubeTransform } from '../../utils/cameraMath';
import { faceCellTarget, GRID_INDICES } from '../../utils/faceGrid';
import { useCameraState } from '../../hooks/useCameraState';
import s from '../../styles.module.css';

/** Side + top faces rendered on the cube; `T` for top, cardinals for the sides. */
const FACES: { face: FaceId; label: string; className: string }[] = [
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
 * orientation onto the CSS cube (`rotateX(pitch) rotateZ(-bearing)`). Each face
 * is a 3×3 grid of hit cells whose `data-face` resolves via
 * {@link faceCellTarget} (center → face, top corners → iso 3/4 vertices, the
 * rest falling back to the face). A `hoveredTarget` lights every cell sharing
 * that target across faces, so a corner reads as a wedge. No three.js / GL —
 * pure DOM + CSS transforms.
 */
export const CubeView: React.FC<{ viewer: Viewer; readOrientation: () => CameraState }> = ({
    viewer,
    readOrientation,
}) => {
    const camera = useCameraState(viewer, readOrientation);
    const [hoveredTarget, setHoveredTarget] = useState<CubeTarget | null>(null);

    return (
        <div
            className={s.cube}
            style={{ transform: cubeTransform(camera) }}
            onPointerLeave={() => {
                setHoveredTarget(null);
            }}
        >
            {FACES.map(({ face, label, className }) => {
                return (
                    <div key={face} className={`${s.face} ${className}`}>
                        <div className={s.grid}>
                            {GRID_INDICES.map((row) => {
                                return GRID_INDICES.map((col) => {
                                    const target = faceCellTarget(face, col, row);
                                    const isCenter = row === 1 && col === 1;
                                    // Cells that fall back to the face (center + the unsupported
                                    // bottom rim) all snap to the face, but only the center lights —
                                    // a face hover highlights its center segment alone, while the
                                    // bottom rim stays a silent click target. Zone cells (their
                                    // target differs from the face) always light as the shared wedge.
                                    const isFallback = target === face;
                                    const isActive =
                                        hoveredTarget !== null && target === hoveredTarget && (isCenter || !isFallback);
                                    return (
                                        <div
                                            key={`${row}-${col}`}
                                            className={s.cell}
                                            data-face={target}
                                            data-active={isActive || undefined}
                                            onPointerEnter={() => {
                                                setHoveredTarget(target);
                                            }}
                                        >
                                            {isCenter && <span className={s.label}>{label}</span>}
                                        </div>
                                    );
                                });
                            })}
                        </div>
                    </div>
                );
            })}
            {/* Bottom face is never seen; rendered so the cube reads as solid when tilted. */}
            <div className={clsx(s.face, s['face-bottom'])} />
        </div>
    );
};
