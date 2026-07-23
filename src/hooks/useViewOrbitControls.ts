import type { PatioBounds } from '@/services/patios/types';
import { useEffect } from 'react';
import { useCesiumMapReady, useCesiumViewer } from '@/contexts/CesiumViewerContext';
import {
    Cartesian2,
    Cartesian3,
    HeadingPitchRange,
    Matrix4,
    ScreenSpaceEventHandler,
    ScreenSpaceEventType,
} from 'cesium';
import { DRAG_SENSITIVITY, MAX_PITCH } from '@/components/ViewCube/constants';
import {
    bearingToHeading,
    cesiumPitchToDisplay,
    clampPitch,
    displayPitchToCesium,
    headingToBearing,
    normalizeBearing,
    orbitCamera,
} from '@/components/ViewCube/utils/cameraMath';
import { useOrbitTarget } from './useOrbitTarget';

/** A camera pose on the sphere around centre: where the orbit animator eases to/from. */
type Orientation = { bearing: number; pitch: number; range: number };

/** Drag base captured at press: pixel origin + the orientation deltas accumulate onto. */
type DragGesture = {
    startX: number;
    startY: number;
    bearing: number;
    pitch: number;
    range: number;
};

/**
 * Smallest display pitch (deg) the orbit may reach — a hair short of straight-down
 * (top-down = 0). At exactly 0 the camera sits on the orbit sphere's pole, where
 * `lookAt`'s heading is singular and Cesium snaps it to the opposite side: the
 * "instant 180° flip" glitch. Holding a degree off the pole keeps heading defined,
 * so tilting to the top parks there instead of flipping. View-orbit only; the
 * shared {@link clampPitch}/ViewCube top face (pitch 0) are unchanged.
 */
const VIEW_PITCH_MIN = 1;

/** Clamp a display pitch to the view-orbit band [{@link VIEW_PITCH_MIN}, {@link MAX_PITCH}]. */
const clampViewPitch = (pitch: number): number => {
    return Math.min(MAX_PITCH, Math.max(VIEW_PITCH_MIN, clampPitch(pitch)));
};

/**
 * Exponential-smoothing time constant (ms) the applied pose chases the target
 * pose by. Larger = smoother/heavier; smaller = snappier. ~90ms tracks the
 * pointer closely while damping the per-event jitter into a fluid glide.
 */
const SMOOTH_TAU_MS = 90;

/**
 * Per-frame velocity retention for the release momentum (fraction kept each
 * ~16.67ms frame). 0.92 ≈ a ~0.4s glide — enough to feel weighty, short enough
 * to settle.
 */
const COAST_FRICTION = 0.92;

/** Reference frame duration (ms) the friction factor is normalized to. */
const COAST_FRAME_MS = 1000 / 60;

/** Speed (deg/ms) below which momentum stops — sub-pixel motion nobody sees. */
const COAST_MIN_SPEED = 0.002;

/** Speed cap (deg/ms) per axis so a fast flick glides, not rockets. */
const COAST_MAX_SPEED = 0.6;

/**
 * Max age (ms) of the last drag sample at release for it to seed momentum. A
 * stale sample (finger paused before lift) means "no throw" → the camera settles.
 */
const COAST_SEED_MAX_AGE_MS = 60;

/** Settle thresholds: below these deltas the applied pose has caught the target. */
const SETTLE_ANGLE_DEG = 0.01;
const SETTLE_RANGE_RATIO = 0.0002;

/**
 * Range multiplier applied per one wheel notch of zoom-in. One notch shrinks the
 * distance-to-centre to 90% (zoom-out grows it to ~111%) — calibrated to feel
 * comparable to Cesium's native wheel dolly across the narrow view zoom band.
 */
const WHEEL_ZOOM_FACTOR_PER_NOTCH = 0.9;

/** Wheel delta (browser units) of one detent; the exponent base for the notch. */
const WHEEL_NOTCH_DELTA = 120;

/**
 * Range multiplier per pixel of two-finger spread. A ~230px spread ≈ halves the
 * range (`0.997**230 ≈ 0.5`); pinch-together (negative spread) grows it.
 */
const PINCH_ZOOM_FACTOR_PER_PX = 0.997;

/** Signed shortest angular delta from→to (deg, [-180, 180]) — wrap-aware bearing diff. */
const signedBearingDelta = (from: number, to: number): number => {
    return ((to - from + 540) % 360) - 180;
};

/** Clamp a signed speed to ±{@link COAST_MAX_SPEED}. */
const capSpeed = (speed: number): number => {
    return Math.max(-COAST_MAX_SPEED, Math.min(COAST_MAX_SPEED, speed));
};

/**
 * Center-locked orbit controls for the read-only Patio View map. Shared sibling
 * of {@link useIdleRotation}; the caller passes the patio `bounds` and the hook
 * reads the Viewer from {@link useCesiumViewer}.
 *
 * With every native camera input disabled in `'view'` mode (see
 * `applyInteractionMode`), this hook is the only thing that drives the map camera
 * during interaction. It installs one Cesium {@link ScreenSpaceEventHandler} and
 * orbits/zooms strictly around the patio bounds centre — the identical
 * {@link useOrbitTarget} pivot the ViewCube and idle orbit use, so there is no
 * seam between controls.
 *
 * **Damped, single-loop motion.** Every gesture writes only to a `target`
 * {@link Orientation}; a persistent RAF eases an applied `current` pose toward it
 * by exponential smoothing ({@link SMOOTH_TAU_MS}), applying one `lookAt(centre,
 * HeadingPitchRange)` per frame. This decouples the render cadence from the
 * (bursty, coalesced) pointer/wheel event cadence, so the orbit reads as a fluid
 * glide rather than snapping event-to-event.
 *
 * - Left-drag (mouse OR one-finger touch) accumulates the pixel delta from press
 *   through the pure {@link orbitCamera} (`dx` → heading, `dy` → pitch, clamped to
 *   0–{@link MAX_PITCH}) and moves the target; the loop chases it.
 * - Wheel / two-finger pinch dolly the target range only (heading/pitch frozen),
 *   clamped to the controller's `minimumZoomDistance`/`maximumZoomDistance` band —
 *   so the patio stays dead-centre at every zoom and can never dolly into the
 *   ground or out to orbit.
 * - Releasing a flick hands the last drag velocity to the same loop as momentum
 *   that decays by {@link COAST_FRICTION}; the loop then settles and parks itself.
 *
 * The applied pose resyncs from the live camera whenever the loop restarts idle,
 * so any idle-orbit drift between interactions is picked up seamlessly. The whole
 * loop + handler tears down on unmount / viewer change, so a destroyed Viewer is
 * never mutated.
 */
export const useViewOrbitControls = (bounds: PatioBounds) => {
    const viewer = useCesiumViewer();
    const ready = useCesiumMapReady();
    const targetRef = useOrbitTarget(viewer, bounds);

    useEffect(
        function installViewOrbitControls() {
            // Gate on `ready` so a drag can't fire before the patio is framed (the
            // loading overlay covers the map until then anyway); mirrors idle orbit.
            if (!viewer || !ready) {
                return undefined;
            }

            const { camera, scene } = viewer;
            const handler = new ScreenSpaceEventHandler(scene.canvas);

            // Applied pose (what the camera shows) vs target pose (where gestures
            // point it); the loop eases current → target each frame.
            const current: Orientation = { bearing: 0, pitch: 0, range: 0 };
            const target: Orientation = { bearing: 0, pitch: 0, range: 0 };

            let gesture: DragGesture | null = null;
            let dragging = false;
            // Release momentum (deg/ms), tracked from the last two drag targets.
            let velBearing = 0;
            let velPitch = 0;
            // Last target sample during the active drag; the pair gives the velocity.
            let sampleBearing = 0;
            let samplePitch = 0;
            let sampleTs = 0;
            let hasSample = false;

            let rafId: number | null = null;
            let prevTs: number | null = null;

            /** Current controller zoom band → clamp a candidate range to [min, max]. */
            const clampRange = (range: number) => {
                const controller = scene.screenSpaceCameraController;
                return Math.max(controller.minimumZoomDistance, Math.min(controller.maximumZoomDistance, range));
            };

            /** Read the live camera pose (relative to centre) into an Orientation. */
            const readLive = (center: Cartesian3): Orientation => {
                return {
                    bearing: headingToBearing(camera.heading),
                    pitch: clampViewPitch(cesiumPitchToDisplay(camera.pitch)),
                    range: Cartesian3.distance(camera.positionWC, center),
                };
            };

            /** Point the camera at centre with the applied `current` pose. */
            const applyCurrent = (center: Cartesian3) => {
                const offset = new HeadingPitchRange(
                    bearingToHeading(current.bearing),
                    displayPitchToCesium(current.pitch),
                    current.range
                );
                camera.cancelFlight();
                camera.lookAt(center, offset);
                // Release the lookAt reference frame so later reads/moves are global.
                camera.lookAtTransform(Matrix4.IDENTITY);
                scene.requestRender();
            };

            /** True once the applied pose has effectively caught the target. */
            const settled = (): boolean => {
                const dBearing = Math.abs(signedBearingDelta(current.bearing, target.bearing));
                const dPitch = Math.abs(target.pitch - current.pitch);
                const dRange = Math.abs(target.range - current.range);
                return (
                    dBearing < SETTLE_ANGLE_DEG &&
                    dPitch < SETTLE_ANGLE_DEG &&
                    dRange < target.range * SETTLE_RANGE_RATIO
                );
            };

            const frame = (ts: number) => {
                const center = targetRef.current;
                if (!center || viewer.isDestroyed()) {
                    rafId = null;
                    return;
                }
                const dt = prevTs === null ? COAST_FRAME_MS : Math.min(ts - prevTs, 100);
                prevTs = ts;

                // Released flick: advance the target by decaying momentum so the
                // glide continues past the finger, then let easing chase it.
                if (!dragging && (velBearing !== 0 || velPitch !== 0)) {
                    target.bearing = normalizeBearing(target.bearing + velBearing * dt);
                    const nextPitch = clampViewPitch(target.pitch + velPitch * dt);
                    if (nextPitch === VIEW_PITCH_MIN || nextPitch === MAX_PITCH) {
                        velPitch = 0;
                    }
                    target.pitch = nextPitch;
                    const decay = COAST_FRICTION ** (dt / COAST_FRAME_MS);
                    velBearing *= decay;
                    velPitch *= decay;
                    if (Math.hypot(velBearing, velPitch) < COAST_MIN_SPEED) {
                        velBearing = 0;
                        velPitch = 0;
                    }
                }

                // Exponential smoothing: fraction of the remaining gap closed this frame.
                const alpha = 1 - Math.exp(-dt / SMOOTH_TAU_MS);
                current.bearing = normalizeBearing(
                    current.bearing + signedBearingDelta(current.bearing, target.bearing) * alpha
                );
                current.pitch += (target.pitch - current.pitch) * alpha;
                current.range += (target.range - current.range) * alpha;
                applyCurrent(center);

                // Park the loop once idle: no drag, no momentum, target reached.
                if (!dragging && velBearing === 0 && velPitch === 0 && settled()) {
                    current.bearing = target.bearing;
                    current.pitch = target.pitch;
                    current.range = target.range;
                    applyCurrent(center);
                    rafId = null;
                    return;
                }
                rafId = requestAnimationFrame(frame);
            };

            const ensureLoop = () => {
                if (rafId === null) {
                    prevTs = null;
                    rafId = requestAnimationFrame(frame);
                }
            };

            /**
             * Resync the applied + target pose from the live camera when starting a
             * fresh interaction while the loop is idle — picks up any idle-orbit
             * drift since the last gesture so motion never jumps.
             */
            const syncFromLiveIfIdle = (center: Cartesian3) => {
                if (rafId === null) {
                    const live = readLive(center);
                    current.bearing = live.bearing;
                    current.pitch = live.pitch;
                    current.range = live.range;
                    target.bearing = live.bearing;
                    target.pitch = live.pitch;
                    target.range = live.range;
                }
            };

            const beginDrag = (event: ScreenSpaceEventHandler.PositionedEvent) => {
                const center = targetRef.current;
                if (!center) {
                    return;
                }
                syncFromLiveIfIdle(center);
                // Base drag accumulation on the current TARGET so pixels map to an
                // absolute orientation from press, drift-free across the gesture.
                gesture = {
                    startX: event.position.x,
                    startY: event.position.y,
                    bearing: target.bearing,
                    pitch: target.pitch,
                    range: target.range,
                };
                dragging = true;
                velBearing = 0;
                velPitch = 0;
                hasSample = false;
                ensureLoop();
            };

            const moveDrag = (event: ScreenSpaceEventHandler.MotionEvent) => {
                if (!gesture || viewer.isDestroyed()) {
                    return;
                }
                const dx = event.endPosition.x - gesture.startX;
                const dy = event.endPosition.y - gesture.startY;
                const next = orbitCamera(gesture, dx, dy, DRAG_SENSITIVITY);
                const nextPitch = clampViewPitch(next.pitch);
                target.bearing = next.bearing;
                target.pitch = nextPitch;

                // Cesium motion events carry no timestamp; sample the clock so the
                // release momentum can derive a real deg/ms velocity.
                const ts = performance.now();
                if (hasSample) {
                    const dt = ts - sampleTs;
                    if (dt > 0) {
                        velBearing = capSpeed(signedBearingDelta(sampleBearing, next.bearing) / dt);
                        velPitch = capSpeed((nextPitch - samplePitch) / dt);
                    }
                }
                sampleBearing = next.bearing;
                samplePitch = nextPitch;
                sampleTs = ts;
                hasSample = true;
                ensureLoop();
            };

            const endDrag = () => {
                if (!gesture) {
                    return;
                }
                gesture = null;
                dragging = false;
                // Only throw if the last move was recent (a live flick) and fast
                // enough to be intentional; otherwise the camera settles in place.
                const stale = !hasSample || performance.now() - sampleTs > COAST_SEED_MAX_AGE_MS;
                if (stale || Math.hypot(velBearing, velPitch) < COAST_MIN_SPEED) {
                    velBearing = 0;
                    velPitch = 0;
                }
                ensureLoop();
            };

            /**
             * Dolly the target range by `factor` (`<1` = closer, `>1` = farther),
             * preserving heading/pitch so only range changes and the patio stays
             * dead-centre. Clamped to the controller's zoom band; the loop eases in.
             */
            const zoomByFactor = (factor: number) => {
                const center = targetRef.current;
                if (!center) {
                    return;
                }
                syncFromLiveIfIdle(center);
                target.range = clampRange(target.range * factor);
                ensureLoop();
            };

            // Wheel/trackpad: positive delta = scroll up = zoom in (range shrinks).
            const wheelZoom = (delta: number) => {
                zoomByFactor(WHEEL_ZOOM_FACTOR_PER_NOTCH ** (delta / WHEEL_NOTCH_DELTA));
            };

            // Two-finger pinch: spread apart (distance grows) = zoom in.
            const pinchZoom = (event: ScreenSpaceEventHandler.TwoPointMotionEvent) => {
                const currDist = Cartesian2.distance(event.position1, event.position2);
                const prevDist = Cartesian2.distance(event.previousPosition1, event.previousPosition2);
                const spread = currDist - prevDist;
                zoomByFactor(PINCH_ZOOM_FACTOR_PER_PX ** spread);
            };

            handler.setInputAction(beginDrag, ScreenSpaceEventType.LEFT_DOWN);
            handler.setInputAction(moveDrag, ScreenSpaceEventType.MOUSE_MOVE);
            handler.setInputAction(endDrag, ScreenSpaceEventType.LEFT_UP);
            handler.setInputAction(wheelZoom, ScreenSpaceEventType.WHEEL);
            handler.setInputAction(pinchZoom, ScreenSpaceEventType.PINCH_MOVE);

            return function teardownViewOrbitControls() {
                if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
                handler.destroy();
            };
        },
        [viewer, ready, targetRef]
    );
};
