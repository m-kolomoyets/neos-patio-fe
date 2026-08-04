import type { PerspectiveCamera } from 'three';
import type { CaptureBridgeProps, FitCameraProps, ModelAnimatorProps, ModelPreviewSceneProps } from './types';
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import PauseIcon from '@/icons/pause-square_24.svg?react';
import PlayIcon from '@/icons/play_24.svg?react';
import { Center, OrbitControls, useAnimations } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box3, LoopOnce, Vector3 } from 'three';
import { captureCanvasThumbnail } from '@/lib/utils/captureCanvasThumbnail';
import { Button } from '@/components/ui/Button';
import s from './styles.module.css';

/**
 * Lives inside the Canvas so it can reach the WebGL renderer. Exposes a capture
 * getter to the parent (which sits outside the R3F tree) and signals readiness a
 * couple of frames in, after drei `<Stage>` has auto-framed the camera.
 */
const CaptureBridge: React.FC<CaptureBridgeProps> = ({ register, onReady }) => {
    const gl = useThree((state) => {
        return state.gl;
    });
    const scene = useThree((state) => {
        return state.scene;
    });
    const camera = useThree((state) => {
        return state.camera;
    });
    const framesRef = useRef(0);

    useEffect(() => {
        register(() => {
            // Force a synchronous render so the preserved framebuffer matches the
            // current camera before we read it back.
            gl.render(scene, camera);
            return gl.domElement;
        });
    }, [gl, scene, camera, register]);

    useFrame(() => {
        framesRef.current += 1;
        if (framesRef.current === 2) {
            onReady();
        }
    });

    return null;
};

/**
 * One-shot camera fit. Runs in a layout effect — before the first rendered frame —
 * so the model appears correctly framed with no settle/animation glitch, and the
 * auto-captured thumbnail (taken a couple frames later) reflects the final framing.
 * The model is centered at the origin by `<Center>`, so the camera only needs to be
 * pushed back along Z; OrbitControls' default target (0,0,0) then matches.
 */
const FitCamera: React.FC<FitCameraProps> = ({ object }) => {
    const camera = useThree((state) => {
        return state.camera as PerspectiveCamera;
    });

    useLayoutEffect(() => {
        const size = new Box3().setFromObject(object).getSize(new Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const fov = (camera.fov * Math.PI) / 180;
        // Distance that frames the largest dimension, with margin to spare.
        const distance = (maxDim / 2 / Math.tan(fov / 2)) * 1.6;

        /* eslint-disable react-hooks/immutability -- three.js camera is mutated imperatively */
        camera.position.set(0, 0, distance);
        camera.near = Math.max(distance / 100, 0.01);
        camera.far = distance * 100;
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        /* eslint-enable react-hooks/immutability */
    }, [object, camera]);

    return null;
};

/**
 * Lives inside the Canvas (drei `useAnimations` registers a per-frame mixer
 * update). Plays the first clip once with `LoopOnce` + `clampWhenFinished` so it
 * holds its final pose. Pausing freezes the action; playing after a finish
 * replays from the start.
 */
const ModelAnimator: React.FC<ModelAnimatorProps> = ({ clips, root, playing, onFinished }) => {
    const { actions, names, mixer } = useAnimations(clips, root);
    const firstName = names[0];

    useEffect(() => {
        const action = firstName ? actions[firstName] : null;
        if (!action) {
            return;
        }
        action.setLoop(LoopOnce, 1);
        // eslint-disable-next-line react-hooks/immutability -- three.js actions are mutated imperatively
        action.clampWhenFinished = true;
    }, [actions, firstName]);

    useEffect(() => {
        const handleFinished = () => {
            onFinished();
        };
        mixer.addEventListener('finished', handleFinished);
        return () => {
            mixer.removeEventListener('finished', handleFinished);
        };
    }, [mixer, onFinished]);

    useEffect(() => {
        const action = firstName ? actions[firstName] : null;
        if (!action) {
            return;
        }
        if (playing) {
            // Replay from the top if the previous run finished and is clamped at the end.
            if (action.time >= action.getClip().duration) {
                action.reset();
                action.setLoop(LoopOnce, 1);
                // eslint-disable-next-line react-hooks/immutability -- three.js actions are mutated imperatively
                action.clampWhenFinished = true;
            }
            action.paused = false;
            action.play();
        } else {
            action.paused = true;
        }
    }, [playing, actions, firstName]);

    return null;
};

/**
 * Standalone R3F preview of a parsed model. Centers the model and frames it once
 * on mount via a layout-effect camera fit ({@link FitCamera}) — no resize observe,
 * so user zoom/orbit persists. Lit locally; rotate/zoom with OrbitControls.
 * `preserveDrawingBuffer` keeps the framebuffer readable so the canvas can be
 * snapshotted for a thumbnail at the current zoom.
 *
 * Decoupled from any specific feature: captured blobs are handed to the consumer
 * via {@link ModelPreviewSceneProps.onCapture}. This Canvas is entirely separate
 * from the Cesium-backed MapCanvas.
 */
export const ModelPreviewScene: React.FC<ModelPreviewSceneProps> = ({
    gltf,
    onCapture,
    onCaptureError,
    onRegisterCapture,
    autoCapture = true,
    showControls = true,
    interactive = true,
}) => {
    const getCanvasRef = useRef<(() => HTMLCanvasElement) | null>(null);
    const autoCapturedRef = useRef(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const hasAnimations = gltf.animations.length > 0;

    const captureThumbnailFromCanvas = useCallback(async () => {
        const getCanvas = getCanvasRef.current;
        if (!getCanvas) {
            return;
        }
        try {
            const blob = await captureCanvasThumbnail(getCanvas());
            onCapture?.(blob);
        } catch (error) {
            // Non-blocking: the consumer decides how to surface this.
            onCaptureError?.(error);
        }
    }, [onCapture, onCaptureError]);

    const register = useCallback((getCanvas: () => HTMLCanvasElement) => {
        getCanvasRef.current = getCanvas;
    }, []);

    const handleReady = useCallback(() => {
        // Only seed a default thumbnail when a consumer opted into auto-capture and is
        // listening for it. The catalog preview opts out so opening an asset never
        // silently overwrites its existing thumbnail.
        if (autoCapturedRef.current || !onCapture || !autoCapture) {
            return;
        }
        autoCapturedRef.current = true;
        captureThumbnailFromCanvas();
    }, [captureThumbnailFromCanvas, onCapture, autoCapture]);

    // Lift the capture trigger so an external control (e.g. a bottom-bar button)
    // can snapshot this canvas.
    useEffect(() => {
        onRegisterCapture?.(captureThumbnailFromCanvas);
    }, [onRegisterCapture, captureThumbnailFromCanvas]);

    return (
        <div className={s.wrap} data-interactive={interactive}>
            <Canvas className={s.canvas} gl={{ preserveDrawingBuffer: true }} camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 10, 7]} intensity={1.5} />
                <directionalLight position={[-5, 5, -7]} intensity={0.6} />
                <Suspense fallback={null}>
                    {/* Center at origin + one-shot camera fit (layout effect, pre-first-frame).
                        No resize observe, so user zoom/orbit persists. */}
                    <Center>
                        <primitive object={gltf.scene} />
                    </Center>
                    <FitCamera object={gltf.scene} />
                </Suspense>
                {hasAnimations && (
                    <ModelAnimator
                        clips={gltf.animations}
                        root={gltf.scene}
                        playing={isPlaying}
                        onFinished={() => {
                            setIsPlaying(false);
                        }}
                    />
                )}
                <OrbitControls makeDefault enablePan={false} enabled={interactive} />
                <CaptureBridge register={register} onReady={handleReady} />
            </Canvas>
            {hasAnimations && showControls && (
                <Button
                    className={s.play}
                    type="button"
                    variant="surface"
                    size="sm"
                    isIcon
                    title={isPlaying ? 'Pause' : 'Play'}
                    onClick={() => {
                        setIsPlaying((prev) => {
                            return !prev;
                        });
                    }}
                >
                    <span className={s.icons} aria-hidden="true">
                        <PauseIcon className={s.icon} data-visible={isPlaying} />
                        <PlayIcon className={s.icon} data-visible={!isPlaying} />
                    </span>
                    <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
                </Button>
            )}
        </div>
    );
};
