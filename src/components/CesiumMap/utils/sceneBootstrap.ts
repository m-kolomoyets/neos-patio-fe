import type { PatioBounds } from '@/services/patios/types';
import {
    BoundingSphere,
    Cartesian3,
    Cesium3DTileset,
    Math as CesiumMath,
    HeadingPitchRange,
    Ion,
    Matrix4,
    Rectangle,
    Transforms,
    Viewer,
} from 'cesium';

const ION_TOKEN = import.meta.env.VITE_CESIUM_ACCESS_TOKEN;

/** Pitch the camera looks down at when framing the patio (PRD: -45°). */
const INITIAL_PITCH = CesiumMath.toRadians(-45);

/**
 * Initial zoom relative to the auto-fit framing distance. 2.2 = 220%: the camera
 * sits 1/2.2 of the distance Cesium would pick to just fit the patio sphere, so
 * the patio fills more of the viewport on load.
 */
const INITIAL_ZOOM = 2.2;

/**
 * Set the ion token once at module load (= boot). Silences Cesium's demo-token
 * console warnings and keeps ion assets available later. It is NOT required to
 * render Google Photorealistic 3D Tiles, which authenticate via the Google key.
 */
Ion.defaultAccessToken = ION_TOKEN;

/**
 * Create the map Viewer against `container` with the map's fixed config:
 * demand rendering, no globe (world geometry comes from the P3DT tileset), all
 * default Cesium widgets off. The credit container is left at its default
 * (mounted + visible) to satisfy the imagery provider's attribution terms.
 */
export const configureViewer = (container: HTMLDivElement): Viewer => {
    const viewer = new Viewer(container, {
        // Demand rendering: the scene only re-renders on change (camera move, tile
        // stream, explicit `scene.requestRender()`), not every animation frame.
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
        // Stencil buffer is required for the selection silhouette (Model.silhouetteSize).
        contextOptions: { webgl: { stencil: true } },
        // No default base imagery — the world is the Google P3DT tileset.
        baseLayer: false,
        // Default widgets off.
        baseLayerPicker: false,
        geocoder: false,
        timeline: false,
        animation: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        selectionIndicator: false,
        infoBox: false,
    });

    // Hide the ellipsoid globe; depth/occlusion comes from the tileset alone.
    viewer.scene.globe.show = false;

    return viewer;
};

/**
 * How the map camera may be driven. `'edit'` leaves the default Cesium
 * screen-space controller untouched (today's editor behaviour). `'view'`
 * constrains it to orbit + zoom around the patio: free translate/pan across the
 * globe and free-look/fly are disabled so the patio always stays framed.
 */
export type MapInteraction = 'edit' | 'view';

/**
 * Multipliers off the framed patio's bounding-sphere radius that bound how close
 * / far `'view'` mode may zoom, so the user can never dolly into the ground or
 * out to orbit — the one place always stays framed.
 */
const VIEW_MIN_ZOOM_FACTOR = 0.6;
// Calibrated so the farthest zoom reads 50% on the ViewCube: the readout's 100%
// (`referenceRange`, the patio diagonal) ≈ 2·radius, so a max range of 4·radius =
// 2·referenceRange bottoms the readout out at exactly 50% — the "Zoom to 50%" preset.
const VIEW_MAX_ZOOM_FACTOR = 4;

/** Max horizontal drift (metres) of the camera off the patio centre in `'view'`. */
const VIEW_MAX_PAN_METERS = 2_000;

/**
 * Shallowest Cesium camera pitch (radians) allowed in `'view'`. Ctrl-drag tilts
 * the camera toward the horizon; past it the orbit swings the camera below the
 * ground plane ("underneath the map"). Capping the pitch a few degrees below the
 * horizon (−5°, i.e. always looking at least slightly down) keeps the camera
 * above ground for any bounded range — it can never dip under. Mirrors the
 * display 0–85° band the ViewCube clamps every other camera move to
 * (`displayPitchToCesium(85) = −5°`).
 */
const VIEW_MAX_PITCH = CesiumMath.toRadians(-5);

/** Geographic centre of a patio's bounds as an ECEF point at ground height. */
const boundsCenter = (bounds: PatioBounds): Cartesian3 => {
    const [west, south, east, north] = bounds;
    return Cartesian3.fromDegrees((west + east) / 2, (south + north) / 2);
};

/**
 * Hard-clamp the camera in `'view'` so it can never (a) drift horizontally more
 * than {@link VIEW_MAX_PAN_METERS} off the patio centre, nor (b) tilt past
 * {@link VIEW_MAX_PITCH} — below which any orbit (plain left-drag OR ctrl-drag,
 * both tilt pitch in Cesium 3D) would swing the camera underneath the map.
 * Returns a combined teardown for the two listeners it installs.
 *
 * The two clamps run on deliberately different signals and corrections:
 *
 * - Pitch → `scene.preRender` (EVERY rendered frame). The camera dips under the
 *   map *during* an active drag, not just when it settles, so capping on
 *   `camera.changed` (which fires only past `percentageChanged`) would let
 *   individual frames slip below ground before correcting. preRender runs after
 *   the controller applies each frame's input and before the frame paints, so no
 *   frame is ever rendered with the camera under the map. When pitch is in range
 *   this is a cheap comparison and a no-op — it only engages at the boundary.
 *   The correction re-establishes a clean `lookAt` orbit at the capped pitch
 *   (current heading + range preserved). Re-aiming — not just lifting the
 *   position — is what avoids the "glitch on the way back up": a position-only
 *   lift pins the camera below the live tilt gesture's stored pivot, desyncing
 *   them until the gesture restarts (re-pressing the mouse/Ctrl). Rebuilding the
 *   orbit frame stays consistent, and the cap disengages the instant pitch
 *   returns in-range, so reversing the tilt is smooth.
 *
 * - Pan → `camera.changed`. Cesium's orbit pivots around the point under the
 *   cursor, so repeated zoom+orbit slowly walks the focus off the patio. Snap the
 *   camera *position* back onto the {@link VIEW_MAX_PAN_METERS} disc around centre
 *   (in the centre's east-north-up frame) WITHOUT re-aiming — keeping direction/up
 *   so the view glides along the boundary instead of shaking.
 */
const installPanClamp = (viewer: Viewer, bounds: PatioBounds): (() => void) => {
    const { camera, scene } = viewer;
    const center = boundsCenter(bounds);
    const toLocal = Matrix4.inverse(Transforms.eastNorthUpToFixedFrame(center), new Matrix4());
    const toWorld = Transforms.eastNorthUpToFixedFrame(center);
    const local = new Cartesian3();
    let clamping = false;

    // Pitch cap: enforced per frame so the camera never renders under the map.
    const capPitch = () => {
        if (clamping || camera.pitch <= VIEW_MAX_PITCH) return;
        const range = Cartesian3.distance(camera.positionWC, center);
        clamping = true;
        camera.lookAt(center, new HeadingPitchRange(camera.heading, VIEW_MAX_PITCH, range));
        // Release the lookAt reference frame so the default controls stay free.
        camera.lookAtTransform(Matrix4.IDENTITY);
        clamping = false;
    };

    // Pan clamp: snap horizontal drift back onto the boundary disc.
    const clampPan = () => {
        if (clamping) return;
        Matrix4.multiplyByPoint(toLocal, camera.positionWC, local);
        // Distance in the horizontal (east/north) plane; `local.z` is up (ignored).
        const horizontal = Math.hypot(local.x, local.y);
        if (horizontal <= VIEW_MAX_PAN_METERS) return;

        const scale = VIEW_MAX_PAN_METERS / horizontal;
        local.x *= scale;
        local.y *= scale;
        const clamped = Matrix4.multiplyByPoint(toWorld, local, new Cartesian3());

        clamping = true;
        // Slide the position back onto the boundary WITHOUT re-aiming: keep the
        // current direction/up so the view doesn't shake. `setView` recomputes
        // orientation from heading/pitch every event and fights the active drag —
        // moving only the position glides smoothly along the boundary instead.
        camera.position = clamped;
        clamping = false;
    };

    // `changed` fires once the camera settles past `percentageChanged`; lower it
    // so small orbit/zoom drifts still trip the pan clamp.
    camera.percentageChanged = 0.05;
    const removePitch = scene.preRender.addEventListener(capPitch);
    const removePan = camera.changed.addEventListener(clampPan);
    return () => {
        removePitch();
        removePan();
    };
};

/**
 * Apply the camera-controller constraints for `interaction`. `'edit'` is a no-op
 * (default controller). `'view'` locks out pan/translate and free-look so the
 * camera can only orbit and zoom around the framed patio, clamps the zoom
 * distance to the patio's bounding sphere, clamps horizontal drift to
 * {@link VIEW_MAX_PAN_METERS}, and caps the tilt at {@link VIEW_MAX_PITCH} — it
 * can never fly away, zoom too far, pan off, or dip under the map.
 * Returns a teardown for the pan-clamp listener (`'edit'` returns a no-op).
 */
export const applyInteractionMode = (
    viewer: Viewer,
    interaction: MapInteraction,
    bounds: PatioBounds
): (() => void) => {
    if (interaction === 'edit') return () => {};

    const controller = viewer.scene.screenSpaceCameraController;
    // Orbit + zoom stay; free pan across the globe and free-look/fly are off.
    controller.enableTranslate = false;
    controller.enableLook = false;
    controller.enableRotate = true;
    controller.enableZoom = true;
    controller.enableTilt = true;

    // Kill inertial coasting. Without this the camera keeps drifting into the
    // boundary after the pointer releases, so the pan-clamp re-fires every frame
    // and the view jitters. Zero inertia = movement stops the instant input ends,
    // and the clamp corrects the position exactly once on contact.
    controller.inertiaSpin = 0;
    controller.inertiaTranslate = 0;
    controller.inertiaZoom = 0;

    // Clamp zoom to a band around the framed patio so the user stays on one place.
    const [west, south, east, north] = bounds;
    const { radius } = BoundingSphere.fromRectangle3D(Rectangle.fromDegrees(west, south, east, north));
    controller.minimumZoomDistance = radius * VIEW_MIN_ZOOM_FACTOR;
    controller.maximumZoomDistance = radius * VIEW_MAX_ZOOM_FACTOR;

    return installPanClamp(viewer, bounds);
};

/**
 * Fallback delay after which the scene is reported "ready" even if the tileset
 * never settles, so a loading overlay waiting on {@link bootstrapScene} can never
 * get stuck.
 */
const READY_TIMEOUT_MS = 8000;

type BootstrapSceneOptions = {
    /**
     * Called once the patio place is framed and its first LOD has settled
     * (tileset `initialTilesLoaded`), or after {@link READY_TIMEOUT_MS} as a
     * safety net — whichever fires first.
     */
    onReady?: () => void;
};

/**
 * Load Google Photorealistic 3D Tiles for the patio and frame the camera on its
 * bounds (heading 0, pitch -45°). Returns a teardown that cancels the in-flight
 * load so a Viewer torn down mid-fetch is not mutated after destruction.
 *
 * Note: persisting this framing as the saved Home view is deferred to the
 * ViewCube camera adapter slice (S6), which owns Home-view storage.
 */
export const bootstrapScene = (
    viewer: Viewer,
    bounds: PatioBounds,
    options: BootstrapSceneOptions = {}
): (() => void) => {
    const { onReady } = options;

    let cancelled = false;
    let readySignalled = false;
    let removeTilesListener: (() => void) | null = null;

    const signalReady = () => {
        if (readySignalled || cancelled) {
            return;
        }
        readySignalled = true;
        onReady?.();
    };

    // Safety net: report ready even if the tileset never finishes settling.
    const readyTimer = setTimeout(signalReady, READY_TIMEOUT_MS);

    // Frame the camera on the patio SYNCHRONOUSLY, before the tileset load is even
    // awaited — the framing needs only the bounds (ellipsoid-height sphere), not
    // the tiles. This puts the camera on the patio from frame 0 so tiles stream in
    // over the correct view, instead of leaving it parked at Cesium's default
    // whole-earth position during the async load (a window in which the idle orbit
    // could capture a faraway pivot, or the ready-timeout could lift the overlay
    // on an un-framed scene).
    frameBounds(viewer, bounds);

    void (async () => {
        try {
            // Google Photorealistic 3D Tiles asset ID
            const tileset = await Cesium3DTileset.fromIonAssetId(2275207);

            if (cancelled || viewer.isDestroyed()) {
                return;
            }

            // Provider ToS requires on-screen data attributions.
            tileset.showCreditsOnScreen = true;
            viewer.scene.primitives.add(tileset);

            // Authoritative re-frame now the canvas is certainly laid out (the
            // synchronous frame above can no-op if the container was still 0-sized
            // when the effect ran, which yields a degenerate frustum aspect). Cheap
            // (duration 0) and idempotent when the sync frame already succeeded.
            frameBounds(viewer, bounds);

            // Fires once when all tiles requested for the framed view have loaded
            // their first LOD — the moment the place is actually rendered.
            removeTilesListener = tileset.initialTilesLoaded.addEventListener(signalReady);
        } catch (error) {
            if (!cancelled) {
                // eslint-disable-next-line no-console
                console.error('Failed to load Google Photorealistic 3D Tiles', error);
                // Don't strand a waiting overlay if the tileset failed to load.
                signalReady();
            }
        }
    })();

    return () => {
        cancelled = true;
        clearTimeout(readyTimer);
        removeTilesListener?.();
    };
};

/**
 * Snap the camera to view the whole patio rectangle at heading 0 / pitch -45°,
 * orbiting the bounds centre.
 *
 * Frames via `flyToBoundingSphere` (not `flyTo({ destination: Rectangle })`):
 * a Rectangle destination positions the camera to fit the rect top-down and then
 * overrides orientation in place, so the camera tilts to -45° without
 * repositioning to aim at the centre — it ends up parked over the centre looking
 * off into space. `flyToBoundingSphere` always looks at the sphere centre, and a
 * `range` of 0 lets Cesium derive the fitting distance from the sphere radius.
 * This matches the `HeadingPitchRange`-around-centre model the ViewCube camera
 * adapter uses for every other move.
 */
const frameBounds = (viewer: Viewer, bounds: PatioBounds) => {
    // A 0-sized canvas (effect ran before layout settled) gives the frustum a
    // NaN aspect ratio, which `flyToBoundingSphere` turns into a NaN camera
    // position — the camera ends up nowhere. Skip; the post-tileset re-frame
    // runs once the canvas is laid out.
    if (viewer.canvas.clientHeight === 0 || viewer.canvas.clientWidth === 0) return;

    const [west, south, east, north] = bounds;
    const sphere = BoundingSphere.fromRectangle3D(Rectangle.fromDegrees(west, south, east, north));

    // Distance at which the sphere just fills the frustum (what `range: 0` picks),
    // then divided by INITIAL_ZOOM to open closer. Use the narrower of the vertical
    // fov and its horizontal counterpart so the sphere always fits either dimension.
    const frustum = viewer.camera.frustum;
    const fovy = 'fovy' in frustum && frustum.fovy ? frustum.fovy : CesiumMath.toRadians(60);
    const fitDistance = sphere.radius / Math.tan(fovy * 0.5);

    viewer.camera.flyToBoundingSphere(sphere, {
        offset: new HeadingPitchRange(0, INITIAL_PITCH, fitDistance / INITIAL_ZOOM),
        duration: 0,
    });

    viewer.scene.requestRender();
};
