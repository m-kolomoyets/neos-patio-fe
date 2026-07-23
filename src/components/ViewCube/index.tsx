import type { MapInteraction } from '@/components/CesiumMap/utils/sceneBootstrap';
import type { PatioBounds } from '@/services/patios/types';
import type { CubeFace } from './types';
import ArrowLeftFilledIcon from '@/icons/arrow-left-filled_24.svg?react';
import ArrowRightFilledIcon from '@/icons/arrow-right-filled_24.svg?react';
import ArrowBottomFilledIcon from '@/icons/arrow-top-filled_24.svg?react';
import HomeIcon from '@/icons/home_24.svg?react';
import clsx from 'clsx';
import { WithClassName } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { useCesiumCamera } from './hooks/useCesiumCamera';
import { useCubeInteraction } from './hooks/useCubeInteraction';
import { useFlattenedFace } from './hooks/useFlattenedFace';
import { useHomeView } from './hooks/useHomeView';
import { CubeView } from './components/CubeView';
import { LiveRotateControl } from './components/LiveRotateControl';
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
type ViewCubeProps = WithClassName<{
    /** Patio bounds framed by the camera; the orbit target is its centre. */
    bounds: PatioBounds;
    /** Stable id (the patio id) keying the per-patio Home-view localStorage entry. */
    storageId: string;
    /**
     * Camera mode. In `'view'` the cube's orbit/zoom pivot on the fixed bounds
     * centre (center-locked, agrees with the map drags); `'edit'` (default)
     * pivots on the viewport-centre ground pick.
     */
    interaction?: MapInteraction;
}>;

export const ViewCube: React.FC<ViewCubeProps> = ({ className, bounds, storageId, interaction = 'edit' }) => {
    const { viewer, referenceRange, readOrientation, easeTo, zoomTo, orbitTo, beginDragOrbit, fitBounds } =
        useCesiumCamera(bounds, interaction);
    const { selectedFace, onSnap, onOrbitStart, stepBy, goTop } = useFlattenedFace({
        viewer,
        readOrientation,
        orbitTo,
    });
    const { isDragging, handlers } = useCubeInteraction({
        viewer,
        readOrientation,
        orbitTo,
        beginDragOrbit,
        onSnap,
        onOrbitStart,
    });
    const { goHome, setHome, resetHome } = useHomeView({ storageId, easeTo, readOrientation, referenceRange });

    if (!viewer) return null;

    return (
        <div className={clsx(s.wrap, className)}>
            <LiveZoomControl
                viewer={viewer}
                readOrientation={readOrientation}
                referenceRange={referenceRange}
                zoomTo={zoomTo}
                fitBounds={fitBounds}
                onSetHome={setHome}
                onResetHome={resetHome}
            />
            <div className={clsx(s['cube-wrap'], 'surface-regular')}>
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
                                        stepBy(1);
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
                                        stepBy(-1);
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
                <LiveRotateControl
                    readOrientation={readOrientation}
                    easeTo={easeTo}
                    isFlattened={selectedFace !== null}
                    stepBy={stepBy}
                />
            </div>
        </div>
    );
};
