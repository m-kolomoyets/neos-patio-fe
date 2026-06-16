import type { AnimationClip, Object3D } from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import PauseIcon from '@/icons/pause-square_24.svg?react';
import PhotoCameraIcon from '@/icons/photocamera_24.svg?react';
import PlayIcon from '@/icons/play_24.svg?react';
import { OrbitControls, Stage, useAnimations } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { LoopOnce } from 'three';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { captureCanvasThumbnail } from '../../utils/captureCanvasThumbnail';
import { useUploadModel } from '../../../../context/UploadModelContext';
import s from './styles.module.css';

const THUMBNAIL_ERROR_MESSAGE = 'Could not capture a thumbnail from the preview.';

type ModelPreviewSceneProps = {
    /** Locally-parsed model to display. */
    gltf: GLTF;
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
 * Standalone R3F preview of the uploaded model. Auto-frames and lights the model
 * locally (drei `<Stage>`, no remote HDR `<Environment>`) and lets the user rotate
 * and zoom with OrbitControls. `preserveDrawingBuffer` keeps the framebuffer
 * readable so the canvas can be snapshotted for the thumbnail.
 *
 * This Canvas is entirely separate from the Cesium-backed MapCanvas — only mounted
 * while the upload flow is in its `preview` state.
 */
export const ModelPreviewScene: React.FC<ModelPreviewSceneProps> = ({ gltf }) => {
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

    return (
        <div className={s.wrap}>
            <Canvas className={s.canvas} gl={{ preserveDrawingBuffer: true }} camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 10, 7]} intensity={1.5} />
                <directionalLight position={[-5, 5, -7]} intensity={0.6} />
                <Suspense fallback={null}>
                    <Stage environment={null} adjustCamera shadows="contact" intensity={1}>
                        <primitive object={gltf.scene} />
                    </Stage>
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
                <OrbitControls makeDefault enablePan={false} />
                <CaptureBridge register={register} onReady={handleReady} />
            </Canvas>
            <div className={s.controls}>
                {hasAnimations && (
                    <Button
                        type="button"
                        variant="surface"
                        size="sm"
                        onClick={() => {
                            setIsPlaying((prev) => {
                                return !prev;
                            });
                        }}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                )}
                <Button type="button" variant="surface" size="sm" onClick={captureThumbnailFromCanvas}>
                    <PhotoCameraIcon />
                    Capture thumbnail
                </Button>
            </div>
        </div>
    );
};
