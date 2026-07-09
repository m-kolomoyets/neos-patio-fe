import type { Viewer } from 'cesium';
import type { PatioBounds } from '@/services/patios/types';
import type { CameraState, CameraTarget } from '../../types';
import { useCallback } from 'react';
import { ZOOM_STEP_FACTOR } from '../../constants';
import { percentToRange, rangeToPercent } from '../../utils/cameraMath';
import { useCameraState } from '../../hooks/useCameraState';
import { ZoomControl } from '../ZoomControl';

type LiveZoomControlProps = {
    viewer: Viewer;
    readOrientation: () => CameraState;
    /** Patio footprint `[west, south, east, north]` framed by zoom-to-fit. */
    bounds: PatioBounds;
    /** Camera range (m) that reads as 100% — the patio diagonal. */
    referenceRange: number;
    easeTo: (_target: CameraTarget) => void;
    fitBounds: (_bounds: PatioBounds) => void;
    onSetHome: () => void;
    onResetHome: () => void;
};

/**
 * Live-zoom leaf: owns the per-frame camera subscription so the (memoized)
 * {@link ZoomControl} only re-renders when the zoom percentage actually changes,
 * not on every pan/orbit frame. Zoom math reads the camera range live (via
 * `readOrientation`) so the step handlers stay stable across renders.
 */
export const LiveZoomControl: React.FC<LiveZoomControlProps> = ({
    viewer,
    readOrientation,
    bounds,
    referenceRange,
    easeTo,
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
            easeTo({ range });
        },
        [readOrientation, easeTo]
    );

    const onZoomToPercent = useCallback(
        (pct: number) => {
            easeTo({ range: percentToRange(pct, referenceRange) });
        },
        [easeTo, referenceRange]
    );

    const onZoomToFit = useCallback(() => {
        fitBounds(bounds);
    }, [fitBounds, bounds]);

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
