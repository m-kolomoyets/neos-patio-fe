import { useEffect } from 'react';
import { Cartesian2, Cartesian3, Math as CesiumMath, HeadingPitchRange, Matrix4, Transforms } from 'cesium';
import { useCesiumViewer } from '../context/CesiumViewerContext';
import { useEditorState } from '../context/EditorContext';
import { useOrbitTarget } from './useOrbitTarget';

/** Idle delay (ms) of no interaction before the camera starts its idle orbit. */
const IDLE_DELAY_MS = 5_000;

/** Idle orbit speed (degrees of bearing per second) — slow, ambient. */
const ROTATION_DEG_PER_SEC = 3;

/** DOM events anywhere in the page that count as "the user is interacting". */
const INTERACTION_EVENTS = ['pointerdown', 'wheel', 'touchstart', 'keydown'] as const;

/**
 * Ambient idle behaviour for the editor camera (Cesium).
 *
 * After {@link IDLE_DELAY_MS} with no pointer/wheel/touch/key interaction, the
 * camera slowly orbits the patio: each frame advances the camera heading by
 * {@link ROTATION_DEG_PER_SEC} around a pivot captured at orbit start — the point
 * the camera currently looks at (screen-centre ground hit), falling back to the
 * bounds-centre target from {@link useOrbitTarget}. Orbiting around the live
 * look-at point (rather than a fixed centre) means the orbit resumes from the
 * exact current view with no recenter snap, even after the user panned away. The
 * per-frame `lookAt` reads the live pitch/range so tilt and zoom are preserved.
 * Any interaction stops the orbit immediately and restarts the idle countdown.
 *
 * The RAF loop only runs while orbiting and fires `scene.requestRender()` per
 * frame, so under `requestRenderMode` the scene animates while orbiting and
 * stays still (no GPU/battery churn) when idle. Interaction is detected from DOM
 * events at the window capture phase, which also catches the overlay widgets
 * (view cube, panels); the orbit's own `lookAt` emits no DOM events, so the loop
 * can never feed itself.
 */
export const useIdleRotation = () => {
    const viewer = useCesiumViewer();
    const { bounds } = useEditorState();
    const targetRef = useOrbitTarget(viewer, bounds);

    useEffect(() => {
        if (!viewer) return undefined;

        let idleTimer: ReturnType<typeof setTimeout> | null = null;
        let frame: number | null = null;
        let lastTs: number | null = null;
        // Pivot the idle orbit revolves around. Captured at orbit start as the
        // point the camera currently looks at (screen-centre ground hit) so the
        // orbit resumes from the exact live view — even after the user panned the
        // map away from the patio centre. Falls back to the bounds-centre target.
        let pivot: Cartesian3 | null = null;

        const resolvePivot = () => {
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
                // Read heading/pitch/range in the TARGET's ENU frame, not the
                // camera's own-position frame — otherwise the HPR we feed back to
                // lookAt (which is target-frame) is mismatched and the first orbit
                // frame snaps. Set the target frame, sample, then orbit within it.
                camera.lookAtTransform(Transforms.eastNorthUpToFixedFrame(target));
                const offset = new HeadingPitchRange(
                    camera.heading + CesiumMath.toRadians(ROTATION_DEG_PER_SEC * deltaSec),
                    camera.pitch,
                    Cartesian3.magnitude(camera.position)
                );
                camera.lookAt(target, offset);
                camera.lookAtTransform(Matrix4.IDENTITY);
                scene.requestRender();
            }
            lastTs = ts;
            frame = requestAnimationFrame(tick);
        };

        const startOrbit = () => {
            if (frame !== null) return;
            lastTs = null;
            pivot = resolvePivot();
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

        INTERACTION_EVENTS.forEach((evt) => {
            window.addEventListener(evt, onInteraction, { capture: true, passive: true });
        });
        armIdle();

        return () => {
            INTERACTION_EVENTS.forEach((evt) => {
                window.removeEventListener(evt, onInteraction, { capture: true });
            });
            if (idleTimer !== null) clearTimeout(idleTimer);
            stopOrbit();
        };
    }, [viewer, targetRef]);
};
