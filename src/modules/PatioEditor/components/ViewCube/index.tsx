import type { CubeFace } from './types';
import ArrowLeftIcon from '@/icons/arrow-left_24.svg?react';
import ArrowRightIcon from '@/icons/arrow-right_24.svg?react';
import ArrowUpIcon from '@/icons/arrow-up_24.svg?react';
import HomeIcon from '@/icons/home_24.svg?react';
import { Button } from '@/components/ui/Button';
import { useEditorState } from '../../context/EditorContext';
import { useCubeInteraction } from './hooks/useCubeInteraction';
import { useFlattenedFace } from './hooks/useFlattenedFace';
import { useHomeView } from './hooks/useHomeView';
import { useMapCamera } from './hooks/useMapCamera';
import { CubeView } from './components/CubeView';
import { LiveZoomControl } from './components/LiveZoomControl';
import s from './styles.module.css';

/** Single-letter labels for the flattened head-on face. */
const FACE_LABELS: Record<CubeFace, string> = { north: 'N', east: 'E', south: 'S', west: 'W' };

/**
 * ViewCube navigation widget (bottom-right overlay).
 *
 * A CSS 3D cube whose perspective mirrors the live map camera, acting as a
 * combined compass + pitch indicator (#02). Faces/corners carry `data-face` for
 * hover and, via {@link useCubeInteraction}, click-to-snap + drag-to-orbit
 * (#03). Clicking a side face flattens the cube to that face with step arrows
 * (#04). No three.js / GL — pure DOM + CSS transforms.
 *
 * The live camera subscription is pushed down into the {@link CubeView} and
 * {@link LiveZoomControl} leaves, so this shell does not re-render per map frame.
 */
export const ViewCube: React.FC = () => {
    const { map, easeTo, jumpTo, fitBounds } = useMapCamera();
    const { selectedFace, onSnap, onOrbitStart, stepBy, goTop } = useFlattenedFace({ map, easeTo });
    const { isDragging, handlers } = useCubeInteraction({ map, easeTo, jumpTo, onSnap, onOrbitStart });
    const { goHome, setHome, resetHome } = useHomeView(map, easeTo);
    const { bounds } = useEditorState();

    if (!map) return null;

    return (
        <div className={s.wrap}>
            <div className={s.scene} data-dragging={isDragging || undefined} {...handlers}>
                {selectedFace ? (
                    // Flattened "selected face" abstraction: drawn flat regardless of the
                    // real ~85° camera pitch, with step arrows (no roll/corner arrows — maplibre has no roll).
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
                            <ArrowUpIcon />
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
                            <ArrowLeftIcon />
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
                            <ArrowRightIcon />
                        </button>
                    </div>
                ) : (
                    <CubeView map={map} />
                )}
            </div>
            <div className={s.controls}>
                <Button isIcon variant="surface" size="md" aria-label="Home view" onClick={goHome} className={s.home}>
                    <HomeIcon />
                </Button>
                <LiveZoomControl
                    map={map}
                    bounds={bounds}
                    easeTo={easeTo}
                    fitBounds={fitBounds}
                    onSetHome={setHome}
                    onResetHome={resetHome}
                />
            </div>
        </div>
    );
};
