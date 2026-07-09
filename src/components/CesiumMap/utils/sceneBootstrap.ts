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
const VIEW_MAX_ZOOM_FACTOR = 3;

/** Max horizontal drift (metres) of the camera off the patio centre in `'view'`. */
const VIEW_MAX_PAN_METERS = 2_000;

/** Geographic centre of a patio's bounds as an ECEF point at ground height. */
const boundsCenter = (bounds: PatioBounds): Cartesian3 => {
    const [west, south, east, north] = bounds;
    return Cartesian3.fromDegrees((west + east) / 2, (south + north) / 2);
};

/**
 * Hard-clamp the camera so its horizontal offset from the patio centre never
 * exceeds {@link VIEW_MAX_PAN_METERS}. Cesium's orbit pivots around the point
 * under the cursor, so repeated zoom+orbit slowly walks the focus off the patio;
 * this listener snaps the camera position back onto the 100 m disc around centre
 * (in the centre's east-north-up frame) after every camera change. Returns the
 * listener remover.
 */
const installPanClamp = (viewer: Viewer, bounds: PatioBounds): (() => void) => {
    const center = boundsCenter(bounds);
    const toLocal = Matrix4.inverse(Transforms.eastNorthUpToFixedFrame(center), new Matrix4());
    const toWorld = Transforms.eastNorthUpToFixedFrame(center);
    const local = new Cartesian3();
    let clamping = false;

    const clamp = () => {
        if (clamping) return;
        const { camera } = viewer;
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
    // so small orbit/zoom drifts still trip the clamp.
    viewer.camera.percentageChanged = 0.05;
    return viewer.camera.changed.addEventListener(clamp);
};

/**
 * Apply the camera-controller constraints for `interaction`. `'edit'` is a no-op
 * (default controller). `'view'` locks out pan/translate and free-look so the
 * camera can only orbit and zoom around the framed patio, clamps the zoom
 * distance to the patio's bounding sphere, and clamps horizontal drift to
 * {@link VIEW_MAX_PAN_METERS} — it can never fly away, zoom too far, or pan off.
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
    const [west, south, east, north] = bounds;
    const sphere = BoundingSphere.fromRectangle3D(Rectangle.fromDegrees(west, south, east, north));

    viewer.camera.flyToBoundingSphere(sphere, {
        offset: new HeadingPitchRange(0, INITIAL_PITCH, 0),
        duration: 0,
    });

    viewer.scene.requestRender();
};
