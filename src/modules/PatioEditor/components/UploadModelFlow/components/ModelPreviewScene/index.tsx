import type { AnimationClip, Object3D, PerspectiveCamera } from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import PauseIcon from '@/icons/pause-square_24.svg?react';
import PlayIcon from '@/icons/play_24.svg?react';
import { Center, OrbitControls, useAnimations } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box3, LoopOnce, Vector3 } from 'three';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { captureCanvasThumbnail } from '../../utils/captureCanvasThumbnail';
import { useUploadModel } from '../../../../context/UploadModelContext';
import s from './styles.module.css';

const THUMBNAIL_ERROR_MESSAGE = 'Could not capture a thumbnail from the preview.';

type ModelPreviewSceneProps = {
    /** Locally-parsed model to display. */
    gltf: GLTF;
    /** Hands the capture handler to the parent so an external control can snapshot the canvas. */
    onRegisterCapture?: (_capture: () => void) => void;
    /** Show the in-scene play/pause overlay. Hidden on the naming step. @default true */
    showControls?: boolean;
    /** Allow orbit/zoom interaction. Disabled on the naming step. @default true */
    interactive?: boolean;
};

type CaptureBridgeProps = {
    /** Receives a getter that renders a fresh frame and hands back the live canvas. */
    register: (_getCanvas: () => HTMLCanvasElement) => void;
    /** Fired once after the scene has settled, so a default thumbnail can be captured. */
    onReady: () => void;
};

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

type FitCameraProps = {
    /** The (already centered) model to frame. Only its size is used. */
    object: Object3D;
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

type ModelAnimatorProps = {
    /** Clips embedded in the uploaded glb (first clip is the one played). */
    clips: AnimationClip[];
    /** Root object the clips animate against. */
    root: Object3D;
    /** Whether the first clip should be running. */
    playing: boolean;
    /** Fired when the clip reaches its end so the parent can reset to Play. */
    onFinished: () => void;
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
 * Standalone R3F preview of the uploaded model. Centers the model and frames it
 * once on mount via a layout-effect camera fit ({@link FitCamera}) — no resize
 * observe, so user zoom/orbit persists across the morph and into the naming step.
 * Lit locally; rotate/zoom with OrbitControls. `preserveDrawingBuffer` keeps the
 * framebuffer readable so the canvas can be snapshotted for the thumbnail at the
 * current zoom.
 *
 * This Canvas is entirely separate from the Cesium-backed MapCanvas — only mounted
 * while the upload flow is in its `preview` state.
 */
export const ModelPreviewScene: React.FC<ModelPreviewSceneProps> = ({
    gltf,
    onRegisterCapture,
    showControls = true,
    interactive = true,
}) => {
    const { captureThumbnail } = useUploadModel();
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
            captureThumbnail(blob);
        } catch {
            // Non-blocking: the user can re-capture; the flow still proceeds.
            toast.error(THUMBNAIL_ERROR_MESSAGE);
        }
    }, [captureThumbnail]);

    const register = useCallback((getCanvas: () => HTMLCanvasElement) => {
        getCanvasRef.current = getCanvas;
    }, []);

    const handleReady = useCallback(() => {
        if (autoCapturedRef.current) {
            return;
        }
        autoCapturedRef.current = true;
        captureThumbnailFromCanvas();
    }, [captureThumbnailFromCanvas]);

    // Lift the capture trigger so the Capture Thumbnail button (rendered outside the
    // morphing scene box, in the bottom bar) can snapshot this canvas.
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
                        No resize observe, so user zoom/orbit persists across the morph. */}
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
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
                </Button>
            )}
        </div>
    );
};
