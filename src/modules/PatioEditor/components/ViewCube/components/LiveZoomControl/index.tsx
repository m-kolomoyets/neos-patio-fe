import type { MapRef } from 'react-map-gl/maplibre';
import type { CameraTarget } from '../../types';
import { useCallback } from 'react';
import { REFERENCE_ZOOM } from '../../constants';
import { percentToZoom, zoomToPercent } from '../../utils/cameraMath';
import { useCameraState } from '../../hooks/useCameraState';
import { ZoomControl } from '../ZoomControl';

type LiveZoomControlProps = {
    map: MapRef;
    /** Patio footprint `[west, south, east, north]` framed by zoom-to-fit. */
    bounds: [west: number, south: number, east: number, north: number];
    easeTo: (_target: CameraTarget) => void;
    fitBounds: (_bounds: [west: number, south: number, east: number, north: number]) => void;
    onSetHome: () => void;
    onResetHome: () => void;
};

/**
 * Live-zoom leaf: owns the per-frame camera subscription so the (memoized)
 * {@link ZoomControl} only re-renders when the zoom percentage actually changes,
 * not on every pan/orbit frame. Zoom math reads the map live (`map.getZoom()`)
 * so the step handlers stay stable across renders.
 */
export const LiveZoomControl: React.FC<LiveZoomControlProps> = ({
    map,
    bounds,
    easeTo,
    fitBounds,
    onSetHome,
    onResetHome,
}) => {
    const camera = useCameraState(map);
    const percent = Math.round(zoomToPercent(camera.zoom, REFERENCE_ZOOM));

    const onStepZoom = useCallback(
        (delta: 1 | -1) => {
            easeTo({ zoom: map.getZoom() + delta });
        },
        [map, easeTo]
    );

    const onZoomToPercent = useCallback(
        (pct: number) => {
            easeTo({ zoom: percentToZoom(pct, REFERENCE_ZOOM) });
        },
        [easeTo]
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
