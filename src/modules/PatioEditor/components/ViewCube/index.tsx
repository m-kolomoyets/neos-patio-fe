import type { CubeFace } from './types';
import ArrowLeftFilledIcon from '@/icons/arrow-left-filled_24.svg?react';
import ArrowRightFilledIcon from '@/icons/arrow-right-filled_24.svg?react';
import ArrowBottomFilledIcon from '@/icons/arrow-top-filled_24.svg?react';
import HomeIcon from '@/icons/home_24.svg?react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { useEditorState } from '../../context/EditorContext';
import { useCesiumCamera } from './hooks/useCesiumCamera';
import { useCubeInteraction } from './hooks/useCubeInteraction';
import { useFlattenedFace } from './hooks/useFlattenedFace';
import { useHomeView } from './hooks/useHomeView';
import { CubeView } from './components/CubeView';
import { LiveZoomControl } from './components/LiveZoomControl';
import s from './styles.module.css';

/** Single-letter labels for the flattened head-on face. */
const FACE_LABELS: Record<CubeFace, string> = { north: 'N', east: 'E', south: 'S', west: 'W' };

/**
 * ViewCube navigation widget (bottom-right overlay).
 *
 * A CSS 3D cube whose perspective mirrors the live Cesium camera, acting as a
 * combined compass + pitch indicator (#02). Faces/corners carry `data-face` for
 * hover and, via {@link useCubeInteraction}, click-to-snap + drag-to-orbit
 * (#03). Clicking a side face flattens the cube to that face with step arrows
 * (#04). No three.js / GL — pure DOM + CSS transforms.
 *
 * The camera adapter ({@link useCesiumCamera}) models every move as a
 * `lookAt(target, HeadingPitchRange)` around the patio bounds centre. The live
 * camera subscription is pushed down into the {@link CubeView} and
 * {@link LiveZoomControl} leaves, so this shell does not re-render per frame.
 */
export const ViewCube: React.FC = () => {
    const { bounds } = useEditorState();
    const { viewer, referenceRange, readOrientation, easeTo, beginDragOrbit, fitBounds } = useCesiumCamera(bounds);
    const { selectedFace, onSnap, onOrbitStart, stepBy, goTop } = useFlattenedFace({ viewer, readOrientation, easeTo });
    const { isDragging, handlers } = useCubeInteraction({
        viewer,
        readOrientation,
        easeTo,
        beginDragOrbit,
        onSnap,
        onOrbitStart,
    });
    const { goHome, setHome, resetHome } = useHomeView({ easeTo, readOrientation, referenceRange });

    if (!viewer) return null;

    return (
        <div className={clsx(s.wrap, 'surface-regular')}>
            <div className={s.top}>
                <Button isIcon variant="link" size="sm" aria-label="Home view" onClick={goHome} className={s.home}>
                    <HomeIcon />
                </Button>
            </div>
            <div className={s['scene-container']}>
                <div className={s.scene} data-dragging={isDragging || undefined} {...handlers}>
                    {selectedFace ? (
                        // Flattened "selected face" abstraction: drawn flat regardless of the real
                        // near-horizon camera pitch, with step arrows (no roll/corner arrows — roll locked to 0).
                        // Buttons stop pointer propagation so the scene drag gesture leaves their clicks intact.
                        <div className={s.flattened}>
                            <button
                                type="button"
                                className={`${s.arrow} ${s['arrow-up']}`}
                                aria-label="Top view"
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                }}
                                onClick={goTop}
                            >
                                <ArrowBottomFilledIcon />
                            </button>
                            <button
                                type="button"
                                className={`${s.arrow} ${s['arrow-left']}`}
                                aria-label="Step left"
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                }}
                                onClick={() => {
                                    stepBy(-1);
                                }}
                            >
                                <ArrowRightFilledIcon />
                            </button>
                            <div className={s['flat-face']}>
                                <span className={s.label}>{FACE_LABELS[selectedFace]}</span>
                            </div>
                            <button
                                type="button"
                                className={`${s.arrow} ${s['arrow-right']}`}
                                aria-label="Step right"
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                }}
                                onClick={() => {
                                    stepBy(1);
                                }}
                            >
                                <ArrowLeftFilledIcon />
                            </button>
                        </div>
                    ) : (
                        <CubeView viewer={viewer} readOrientation={readOrientation} />
                    )}
                </div>
            </div>
            <div className={s.controls}>
                <LiveZoomControl
                    viewer={viewer}
                    readOrientation={readOrientation}
                    bounds={bounds}
                    referenceRange={referenceRange}
                    easeTo={easeTo}
                    fitBounds={fitBounds}
                    onSetHome={setHome}
                    onResetHome={resetHome}
                />
            </div>
        </div>
    );
};
