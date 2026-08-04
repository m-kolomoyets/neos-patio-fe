import type { LiveZoomControlProps } from './types';
import { useCallback } from 'react';
import { ZOOM_STEP_FACTOR } from '../../constants';
import { percentToRange, rangeToPercent } from '../../utils/cameraMath';
import { useCameraState } from '../../hooks/useCameraState';
import { ZoomControl } from './components/ZoomControl';

/**
 * Live-zoom leaf: owns the per-frame camera subscription so the (memoized)
 * {@link ZoomControl} only re-renders when the zoom percentage actually changes,
 * not on every pan/orbit frame. Zoom math reads the camera range live (via
 * `readOrientation`) so the step handlers stay stable across renders.
 */
export const LiveZoomControl: React.FC<LiveZoomControlProps> = ({
    viewer,
    readOrientation,
    referenceRange,
    zoomTo,
    fitBounds,
    onSetHome,
    onResetHome,
}) => {
    const camera = useCameraState(viewer, readOrientation);
    const percent = Math.round(rangeToPercent(camera.range, referenceRange));

    const onStepZoom = useCallback(
        (delta: 1 | -1) => {
            // +1 zooms in → closer → smaller range; -1 zooms out → larger range.
            const range = readOrientation().range / ZOOM_STEP_FACTOR ** delta;
            zoomTo(range);
        },
        [readOrientation, zoomTo]
    );

    const onZoomToPercent = useCallback(
        (pct: number) => {
            zoomTo(percentToRange(pct, referenceRange));
        },
        [zoomTo, referenceRange]
    );

    const onZoomToFit = useCallback(() => {
        fitBounds();
    }, [fitBounds]);

    return (
        <ZoomControl
            percent={percent}
            onStepZoom={onStepZoom}
            onZoomToPercent={onZoomToPercent}
            onZoomToFit={onZoomToFit}
            onSetHome={onSetHome}
            onResetHome={onResetHome}
        />
    );
};
