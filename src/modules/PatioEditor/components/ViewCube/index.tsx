import type { CubeCorner, CubeFace } from './types';
import ArrowLeftIcon from '@/icons/arrow-left_24.svg?react';
import ArrowRightIcon from '@/icons/arrow-right_24.svg?react';
import ArrowUpIcon from '@/icons/arrow-up_24.svg?react';
import HomeIcon from '@/icons/home_24.svg?react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { REFERENCE_ZOOM } from './constants';
import { cubeTransform, percentToZoom, zoomToPercent } from './utils/cameraMath';
import { useEditorState } from '../../context/EditorContext';
import { useCubeInteraction } from './hooks/useCubeInteraction';
import { useFlattenedFace } from './hooks/useFlattenedFace';
import { useHomeView } from './hooks/useHomeView';
import { useMapCamera } from './hooks/useMapCamera';
import { ZoomControl } from './components/ZoomControl';
import s from './styles.module.css';

/** Side + top faces rendered on the cube; `T` for top, cardinals for the sides. */
const FACES: { face: 'top' | CubeFace; label: string; className: string }[] = [
    { face: 'top', label: 'T', className: s['face-top'] },
    { face: 'north', label: 'N', className: s['face-north'] },
    { face: 'east', label: 'E', className: s['face-east'] },
    { face: 'south', label: 'S', className: s['face-south'] },
    { face: 'west', label: 'W', className: s['face-west'] },
];

/** Single-letter labels for the flattened head-on face. */
const FACE_LABELS: Record<CubeFace, string> = { north: 'N', east: 'E', south: 'S', west: 'W' };

/** Corner hit targets pinned to the top face (full 3D corner geometry lands in #03). */
const CORNERS: { corner: CubeCorner; className: string }[] = [
    { corner: 'northwest', className: s['corner-nw'] },
    { corner: 'northeast', className: s['corner-ne'] },
    { corner: 'southwest', className: s['corner-sw'] },
    { corner: 'southeast', className: s['corner-se'] },
];

/**
 * ViewCube navigation widget (bottom-right overlay).
 *
 * A CSS 3D cube whose perspective mirrors the live map camera
 * (`rotateX(pitch) rotateZ(-bearing)`), acting as a combined compass + pitch
 * indicator (#02). Faces/corners carry `data-face` for hover and, via
 * {@link useCubeInteraction}, click-to-snap + drag-to-orbit (#03). Clicking a
 * side face flattens the cube to that face with step arrows (#04). No
 * three.js / GL — pure DOM + CSS transforms.
 */
export const ViewCube: React.FC = () => {
    const { map, camera, easeTo, jumpTo, fitBounds } = useMapCamera();
    const { selectedFace, onSnap, onOrbitStart, stepBy, goTop } = useFlattenedFace({ map, easeTo });
    const { isDragging, handlers } = useCubeInteraction({ map, easeTo, jumpTo, onSnap, onOrbitStart });
    const { goHome, setHome, resetHome } = useHomeView(map, easeTo);
    const { bounds } = useEditorState();

    if (!map) return null;

    const percent = Math.round(zoomToPercent(camera.zoom, REFERENCE_ZOOM));

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
                    <div className={s.cube} style={{ transform: cubeTransform(camera) }}>
                        {FACES.map(({ face, label, className }) => {
                            return (
                                <div key={face} className={`${s.face} ${className}`} data-face={face}>
                                    <span className={s.label}>{label}</span>
                                    {/* Corner targets ride on the top face; full 3D corners land in #03. */}
                                    {face === 'top' &&
                                        CORNERS.map(({ corner, className: cornerClass }) => {
                                            return (
                                                <div
                                                    key={corner}
                                                    className={`${s.corner} ${cornerClass}`}
                                                    data-face={corner}
                                                />
                                            );
                                        })}
                                </div>
                            );
                        })}
                        {/* Bottom face is never seen; rendered so the cube reads as solid when tilted. */}
                        <div className={clsx(s.face, s['face-bottom'])} />
                    </div>
                )}
            </div>
            <div className={s.controls}>
                <Button isIcon variant="surface" size="md" aria-label="Home view" onClick={goHome} className={s.home}>
                    <HomeIcon />
                </Button>
                <ZoomControl
                    percent={percent}
                    onStepZoom={(delta) => {
                        easeTo({ zoom: camera.zoom + delta });
                    }}
                    onZoomToPercent={(pct) => {
                        easeTo({ zoom: percentToZoom(pct, REFERENCE_ZOOM) });
                    }}
                    onZoomToFit={() => {
                        fitBounds(bounds);
                    }}
                    onSetHome={setHome}
                    onResetHome={resetHome}
                />
            </div>
        </div>
    );
};
