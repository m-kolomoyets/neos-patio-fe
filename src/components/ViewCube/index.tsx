import type { ViewCubeProps } from './types';
import ArrowLeftFilledIcon from '@/icons/arrow-left-filled_24.svg?react';
import ArrowRightFilledIcon from '@/icons/arrow-right-filled_24.svg?react';
import ArrowBottomFilledIcon from '@/icons/arrow-top-filled_24.svg?react';
import HomeIcon from '@/icons/home_24.svg?react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { FACE_LABELS } from './constants';
import { useCesiumCamera } from './hooks/useCesiumCamera';
import { useCubeInteraction } from './hooks/useCubeInteraction';
import { useFlattenedFace } from './hooks/useFlattenedFace';
import { useHomeView } from './hooks/useHomeView';
import { CubeView } from './components/CubeView';
import { LiveRotateControl } from './components/LiveRotateControl';
import { LiveZoomControl } from './components/LiveZoomControl';
import s from './styles.module.css';

export const ViewCube: React.FC<ViewCubeProps> = ({
    className,
    bounds,
    height = 0,
    storageId,
    interaction = 'edit',
}) => {
    const { viewer, referenceRange, readOrientation, snapTo, zoomTo, orbitTo, beginDragOrbit, fitBounds } =
        useCesiumCamera(bounds, height, interaction);
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
    const { goHome, setHome, resetHome } = useHomeView({ storageId, snapTo, readOrientation, referenceRange });

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
                    snapTo={snapTo}
                    isFlattened={selectedFace !== null}
                    stepBy={stepBy}
                />
            </div>
        </div>
    );
};
