import type { CameraTarget } from '../../utils/tweenCamera';
import { useEffect, useRef } from 'react';
import CompassIcon from '@/icons/compass-filled_24.svg?react';
import MagnetIcon from '@/icons/magnet_24.svg?react';
import MinusIcon from '@/icons/minus_24.svg?react';
import PlusIcon from '@/icons/plus_24.svg?react';
import RedoIcon from '@/icons/redo_24.svg?react';
import TargetIcon from '@/icons/target_24.svg?react';
import UndoIcon from '@/icons/undo_24.svg?react';
import clsx from 'clsx';
import { NINETY_DEGREES } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { COMPASS_ICON_ROTATION_ANGLE_OFFSET } from './constants';
import { tweenCamera } from '../../utils/tweenCamera';
import { useCreatePatioMap } from '../../hooks/useCreatePatioMap';
import { useGeolocateToMap } from '../../hooks/useGeolocateToMap';
import { useMapBearing } from '../../hooks/useMapBearing';
import s from './styles.module.css';

/**
 * Bottom-left control bar for the Create-Patio Mapbox map. A vertical stack —
 * magnet (no-op placeholder), location, and a zoom +/− group — mounted as a
 * sibling of `<Map>` inside `.map-clip`, plus the rotate/compass row.
 *
 * Every camera control drives the map through {@link tweenCamera} (per-frame
 * `jumpTo`) rather than Mapbox's eased `easeTo`/`flyTo`/`zoomIn`, which build a
 * non-invertible matrix on this pitch-0 globe. Zoom inherits the map's
 * `minZoom`/`maxZoom`, so the −/+ buttons stop at the globe / max detail.
 */
export const MapControls: React.FC = () => {
    const map = useCreatePatioMap();
    const bearing = useMapBearing();
    const geolocate = useGeolocateToMap(map);
    // Cancels the active camera tween so a fresh click supersedes the in-flight
    // one instead of two tweens fighting over `jumpTo`.
    const cancelTween = useRef<(() => void) | undefined>(undefined);

    const runTween = (target: CameraTarget) => {
        if (!map) {
            return;
        }
        cancelTween.current?.();
        cancelTween.current = tweenCamera(map, target);
    };

    useEffect(function cancelTweenOnUnmount() {
        return () => {
            cancelTween.current?.();
        };
    }, []);

    const handleZoomIn = () => {
        if (map) {
            runTween({ zoom: Math.min(map.getZoom() + 1, map.getMaxZoom()) });
        }
    };

    const handleZoomOut = () => {
        if (map) {
            runTween({ zoom: Math.max(map.getZoom() - 1, map.getMinZoom()) });
        }
    };

    const handleRotateLeft = () => {
        runTween({ bearing: bearing - NINETY_DEGREES });
    };

    const handleRotateRight = () => {
        runTween({ bearing: bearing + NINETY_DEGREES });
    };

    const handleResetNorth = () => {
        runTween({ bearing: 0 });
    };

    return (
        <div className={s.wrap}>
            <div className={clsx(s.group)} data-orientation="vertical">
                <Button className={s.cta} isIcon variant="surface" aria-label="Toggle snap mode ">
                    <MagnetIcon />
                    <span className="sr-only">Toggle snap mode </span>
                </Button>
            </div>
            <div className={clsx(s.group)} data-orientation="vertical">
                <Button
                    className={s.cta}
                    isIcon
                    variant="surface"
                    aria-label="Go to my location"
                    isLoading={geolocate.status === 'loading'}
                    disabled={geolocate.isDenied}
                    onClick={geolocate.request}
                >
                    <TargetIcon />
                    <span className="sr-only">Go to my location</span>
                </Button>
            </div>
            <div className={clsx(s.group)} data-orientation="vertical">
                <Button className={s.cta} isIcon variant="surface" aria-label="Zoom in" onClick={handleZoomIn}>
                    <PlusIcon />
                    <span className="sr-only">Zoom in</span>
                </Button>
                <Button className={s.cta} isIcon variant="surface" aria-label="Zoom out" onClick={handleZoomOut}>
                    <MinusIcon />
                    <span className="sr-only">Zoom out</span>
                </Button>
            </div>
            <div className={s.row}>
                <div className={clsx(s.group)} data-orientation="horizontal">
                    <Button
                        className={s.cta}
                        isIcon
                        variant="surface"
                        aria-label="Rotate left"
                        onClick={handleRotateLeft}
                    >
                        <UndoIcon />
                        <span className="sr-only">Rotate left</span>
                    </Button>
                    <Button
                        className={s.cta}
                        isIcon
                        variant="surface"
                        aria-label="Rotate right"
                        onClick={handleRotateRight}
                    >
                        <RedoIcon />
                        <span className="sr-only">Rotate right</span>
                    </Button>
                </div>
                <div className={clsx(s.group)} data-orientation="horizontal">
                    <Button
                        className={s.cta}
                        isIcon
                        variant="surface"
                        aria-label="Reset to north"
                        onClick={handleResetNorth}
                    >
                        <CompassIcon
                            style={{
                                transform: `rotate(${-bearing + COMPASS_ICON_ROTATION_ANGLE_OFFSET}deg)`,
                                transformOrigin: 'center',
                            }}
                        />
                        <span className="sr-only">Reset to north</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};
