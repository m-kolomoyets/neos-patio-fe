import type { PatioBounds } from '@/services/patios/types';
import { useEffect } from 'react';
import { useCesiumMapReady, useCesiumViewer } from '@/contexts/CesiumViewerContext';
import { Cartesian2, Cartesian3, Math as CesiumMath, HeadingPitchRange, Matrix4, Transforms } from 'cesium';
import { useOrbitTarget } from './useOrbitTarget';

/** Idle delay (ms) of no interaction before the camera starts its idle orbit. */
const IDLE_DELAY_MS = 5_000;

/** Idle orbit speed (degrees of bearing per second) — slow, ambient. */
const ROTATION_DEG_PER_SEC = 3;

/** DOM events anywhere in the page that count as "the user is interacting". */
const INTERACTION_EVENTS = ['pointerdown', 'wheel', 'touchstart', 'keydown'] as const;

/** Pitch (rad) kept clear of the ±90° pole so the idle orbit doesn't gimbal-lock. */
const POLE_EPSILON = CesiumMath.toRadians(0.5);

/**
 * Pointer movement only counts as interaction while a button is held — a live
 * drag (view-cube orbit, gizmo, scene pan). A press fires `pointerdown` once, but
 * a sustained drag emits only `pointermove`; without this the idle countdown
 * could elapse mid-drag and the orbit would fight the gesture. Buttonless hover
 * is ignored so merely moving the mouse over the page never blocks idle.
 */
const DRAG_MOVE_EVENT = 'pointermove' as const;

/**
 * Ambient idle behaviour for the map camera (Cesium). Shared by the editor and
 * view routes; the caller passes the patio `bounds` (editor from its context,
 * view from the patio query) so this hook never couples to either module.
 *
 * After {@link IDLE_DELAY_MS} with no pointer/wheel/touch/key interaction, the
 * camera slowly orbits the patio: each frame advances the camera heading by
 * {@link ROTATION_DEG_PER_SEC} around a pivot captured at orbit start — the point
 * the camera currently looks at (screen-centre ground hit), falling back to the
 * bounds-centre target from {@link useOrbitTarget}. Orbiting around the live
 * look-at point (rather than a fixed centre) means the orbit resumes from the
 * exact current view with no recenter snap, even after the user panned away. Pitch
 * and range are captured once at orbit start and held constant, so the camera flies
 * around the pivot at a fixed elevation and distance — only the heading advances.
 * Any interaction stops the orbit immediately and restarts the idle countdown.
 *
 * The RAF loop only runs while orbiting and fires `scene.requestRender()` per
 * frame, so under `requestRenderMode` the scene animates while orbiting and
 * stays still (no GPU/battery churn) when idle. Interaction is detected from DOM
 * events at the window capture phase, which also catches the overlay widgets
 * (view cube, panels); the orbit's own `lookAt` emits no DOM events, so the loop
 * can never feed itself.
 */
export const useIdleRotation = (bounds: PatioBounds, centerLocked = false, height = 0) => {
    const viewer = useCesiumViewer();
    const ready = useCesiumMapReady();
    const targetRef = useOrbitTarget(viewer, bounds, height);

    useEffect(() => {
        // Wait until the scene has framed the patio and painted. Arming the idle
        // countdown before then (on a slow/first/sequential load, where framing
        // trails the async tile fetch) would let the orbit capture the un-framed
        // default whole-earth view and fly the camera off to a faraway pivot.
        if (!viewer || !ready) return undefined;

        let idleTimer: ReturnType<typeof setTimeout> | null = null;
        let frame: number | null = null;
        let lastTs: number | null = null;
        // Pivot the idle orbit revolves around. Captured at orbit start as the
        // point the camera currently looks at (screen-centre ground hit) so the
        // orbit resumes from the exact live view — even after the user panned the
        // map away from the patio centre. Falls back to the bounds-centre target.
        let pivot: Cartesian3 | null = null;
        // Pitch and range captured ONCE at orbit start (in the pivot's ENU frame)
        // and held constant for the whole orbit. Only heading advances per frame,
        // so the camera flies around the pivot at a fixed elevation and distance —
        // no pitch/height creep from re-sampling the live camera each tick.
        let orbitHeading = 0;
        let orbitPitch = 0;
        let orbitRange = 0;

        const resolvePivot = () => {
            // Center-locked routes (Patio View) orbit the fixed bounds-centre — the
            // patio centre the ViewCube orbits — so the idle→drag handoff reads
            // back a pose centred on the place, with no reproject jump. Free-pan routes (editor)
            // keep the live screen-centre pick so orbit resumes from wherever panned.
            if (centerLocked) return targetRef.current;
            const { camera, scene, canvas } = viewer;
            const center = new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
            // Prefer the real rendered surface under the screen centre (depth
            // buffer — includes tileset/terrain) so the pivot is the exact point
            // the camera looks at. Fall back to the ellipsoid ray hit, then to the
            // bounds-centre target.
            const picked = scene.pickPositionSupported ? scene.pickPosition(center) : undefined;
            if (picked) return picked;
            const ray = camera.getPickRay(center);
            const hit = ray ? scene.globe.pick(ray, scene) : undefined;
            return hit ?? targetRef.current;
        };

        const tick = (ts: number) => {
            const target = pivot;
            if (!target || viewer.isDestroyed()) {
                frame = null;
                return;
            }
            if (lastTs !== null) {
                const deltaSec = (ts - lastTs) / 1_000;
                const { camera, scene } = viewer;
                // Advance only the heading; pitch and range stay at the values
                // captured in startOrbit so the camera flies around the pivot at a
                // constant elevation and distance — no tilt/height drift.
                orbitHeading += CesiumMath.toRadians(ROTATION_DEG_PER_SEC * deltaSec);
                camera.lookAt(target, new HeadingPitchRange(orbitHeading, orbitPitch, orbitRange));
                camera.lookAtTransform(Matrix4.IDENTITY);
                scene.requestRender();
            }
            lastTs = ts;
            frame = requestAnimationFrame(tick);
        };

        const startOrbit = () => {
            if (frame !== null) return;
            // A gizmo transform drag pauses the camera controller
            // (`enableInputs = false`) for its whole duration. The idle orbit drives
            // the camera directly and would otherwise fight an in-progress drag, so
            // defer it: re-arm the countdown and retry once the drag releases.
            if (!viewer.scene.screenSpaceCameraController.enableInputs) {
                armIdle();
                return;
            }
            lastTs = null;
            pivot = resolvePivot();
            if (!pivot) return;
            // Sample the live heading/pitch/range in the pivot's ENU frame once so
            // the orbit resumes from the exact current view. From here only heading
            // changes — pitch and range are frozen for the orbit's lifetime.
            const { camera } = viewer;
            camera.lookAtTransform(Transforms.eastNorthUpToFixedFrame(pivot));
            orbitHeading = camera.heading;
            // HeadingPitchRange gimbal-locks at ±90° (top-down, e.g. after a top-face
            // snap): cos(pitch)=0 kills the offset's horizontal components, so heading
            // gains zero leverage on camera position and the orbit freezes in place.
            // Nudge the captured pitch off the pole so heading advances the position
            // again — the ~0.5° tilt is imperceptible.
            orbitPitch = Math.max(camera.pitch, -CesiumMath.PI_OVER_TWO + POLE_EPSILON);
            orbitRange = Cartesian3.magnitude(camera.position);
            camera.lookAtTransform(Matrix4.IDENTITY);
            frame = requestAnimationFrame(tick);
        };

        const stopOrbit = () => {
            if (frame !== null) {
                cancelAnimationFrame(frame);
                frame = null;
            }
            lastTs = null;
        };

        const armIdle = () => {
            if (idleTimer !== null) clearTimeout(idleTimer);
            idleTimer = setTimeout(startOrbit, IDLE_DELAY_MS);
        };

        const onInteraction = () => {
            stopOrbit();
            armIdle();
        };

        // Buttonless moves (plain hover) must not reset idle — only held-button drags.
        const onPointerMove = (e: PointerEvent) => {
            if (e.buttons !== 0) onInteraction();
        };

        INTERACTION_EVENTS.forEach((evt) => {
            window.addEventListener(evt, onInteraction, { capture: true, passive: true });
        });
        window.addEventListener(DRAG_MOVE_EVENT, onPointerMove, { capture: true, passive: true });
        armIdle();

        return () => {
            INTERACTION_EVENTS.forEach((evt) => {
                window.removeEventListener(evt, onInteraction, { capture: true });
            });
            window.removeEventListener(DRAG_MOVE_EVENT, onPointerMove, { capture: true });
            if (idleTimer !== null) clearTimeout(idleTimer);
            stopOrbit();
        };
    }, [viewer, ready, targetRef, centerLocked]);
};
