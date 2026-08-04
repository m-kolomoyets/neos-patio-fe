import type { Viewer } from 'cesium';
import type { CameraState } from '../../types';

export type LiveZoomControlProps = {
    viewer: Viewer;
    readOrientation: () => CameraState;
    /** Camera range (m) that reads as 100% — the patio diagonal. */
    referenceRange: number;
    /** Change only the range, preserving the live camera pose (stepper + presets). */
    zoomTo: (_range: number) => void;
    /** Frame the whole patio at the default orientation (zoom-to-fit). */
    fitBounds: () => void;
    onSetHome: () => void;
    onResetHome: () => void;
};
