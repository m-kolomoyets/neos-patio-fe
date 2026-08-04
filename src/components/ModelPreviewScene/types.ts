import type { AnimationClip, Object3D } from 'three';

/**
 * Structural subset of a parsed glTF the preview needs — decoupled from any
 * specific loader's `GLTF` type (three-stdlib vs drei differ on optional fields).
 */
export type PreviewableModel = {
    scene: Object3D;
    animations: AnimationClip[];
};

export type ModelPreviewSceneProps = {
    /** Already-parsed model to display. */
    gltf: PreviewableModel;
    /** Receives a freshly-captured thumbnail blob when the canvas is snapshotted. */
    onCapture?: (_blob: Blob) => void;
    /** Fired when a capture fails (decoding/context errors). Consumer owns the UX. */
    onCaptureError?: (_error: unknown) => void;
    /** Hands the capture handler to the parent so an external control can snapshot the canvas. */
    onRegisterCapture?: (_capture: () => void) => void;
    /** Auto-snapshot a default thumbnail once the scene settles. @default true */
    autoCapture?: boolean;
    /** Show the in-scene play/pause overlay. @default true */
    showControls?: boolean;
    /** Allow orbit/zoom interaction. @default true */
    interactive?: boolean;
};

export type CaptureBridgeProps = {
    /** Receives a getter that renders a fresh frame and hands back the live canvas. */
    register: (_getCanvas: () => HTMLCanvasElement) => void;
    /** Fired once after the scene has settled, so a default thumbnail can be captured. */
    onReady: () => void;
};

export type FitCameraProps = {
    /** The (already centered) model to frame. Only its size is used. */
    object: Object3D;
};

export type ModelAnimatorProps = {
    /** Clips embedded in the glb (first clip is the one played). */
    clips: AnimationClip[];
    /** Root object the clips animate against. */
    root: Object3D;
    /** Whether the first clip should be running. */
    playing: boolean;
    /** Fired when the clip reaches its end so the parent can reset to Play. */
    onFinished: () => void;
};
