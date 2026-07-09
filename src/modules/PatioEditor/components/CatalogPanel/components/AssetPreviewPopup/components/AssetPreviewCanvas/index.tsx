import { Component, Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ModelPreviewScene } from '@/components/ModelPreviewScene';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

type AssetPreviewCanvasProps = {
    /** URL of the glTF/glb to download and render. */
    src: string;
    /** Receives a freshly-captured thumbnail blob when the canvas is snapshotted. */
    onCapture?: (_blob: Blob) => void;
    /** Fired when a capture fails; the consumer owns the UX. */
    onCaptureError?: (_error: unknown) => void;
    /** Hands the capture trigger to the parent so the action-bar button can snapshot. */
    onRegisterCapture?: (_capture: () => void) => void;
};

/** Suspends while the model downloads, then renders the interactive scene. */
const PreviewModel: React.FC<AssetPreviewCanvasProps> = ({ src, onCapture, onCaptureError, onRegisterCapture }) => {
    const { scene, animations } = useGLTF(src);
    // `useGLTF` caches one parsed scene per URL. A bare `<primitive>` reuses that
    // same Object3D, so on a second open it can't re-attach and renders nothing.
    // Clone per mount (SkeletonUtils preserves skinned meshes + node names, so the
    // animation clips still bind to the copy) while the download stays cached.
    const model = useMemo(() => {
        return { scene: cloneSkeleton(scene), animations };
    }, [scene, animations]);
    return (
        <ModelPreviewScene
            gltf={model}
            onCapture={onCapture}
            onCaptureError={onCaptureError}
            onRegisterCapture={onRegisterCapture}
            // Catalog snapshots are button-driven only — never auto-overwrite the thumb.
            autoCapture={false}
        />
    );
};

type PreviewErrorBoundaryProps = {
    /** Changing this resets the boundary so a new asset gets a fresh attempt. */
    resetKey: string;
    fallback: React.ReactNode;
    children: React.ReactNode;
};

/**
 * Catches glTF load/parse failures so one bad model shows an inline message
 * instead of tearing down the popup. Resets when the previewed asset changes.
 */
class PreviewErrorBoundary extends Component<PreviewErrorBoundaryProps, { hasError: boolean }> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidUpdate(prevProps: PreviewErrorBoundaryProps) {
        if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
            this.setState({ hasError: false });
        }
    }

    render() {
        return this.state.hasError ? this.props.fallback : this.props.children;
    }
}

/**
 * The popup's 3D preview: a downloaded model on the dotted background, with a
 * skeleton while it loads and a graceful "preview unavailable" message on failure.
 */
export const AssetPreviewCanvas: React.FC<AssetPreviewCanvasProps> = ({
    src,
    onCapture,
    onCaptureError,
    onRegisterCapture,
}) => {
    return (
        <PreviewErrorBoundary
            resetKey={src}
            fallback={
                <div className={s.fallback}>
                    <Typography variant="text-sm" className={s['fallback-text']} render={<span />}>
                        Preview unavailable
                    </Typography>
                </div>
            }
        >
            <Suspense fallback={<div className={s.loading} aria-label="Loading preview" />}>
                <PreviewModel
                    key={src}
                    src={src}
                    onCapture={onCapture}
                    onCaptureError={onCaptureError}
                    onRegisterCapture={onRegisterCapture}
                />
            </Suspense>
        </PreviewErrorBoundary>
    );
};
