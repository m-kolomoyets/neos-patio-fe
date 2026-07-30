import type { PatioBounds } from '@/services/patios/types';
import { BoundingSphere, Cesium3DTileset, Math as CesiumMath, HeadingPitchRange, Ion, Rectangle, Viewer } from 'cesium';
import { sampleSurfaceHeight } from '@/lib/utils/sampleSurfaceHeight';

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

/**
 * Apply the camera-controller constraints for `interaction`. `'edit'` is a no-op
 * (default controller). `'view'` disables EVERY native camera input — the map
 * canvas is driven entirely by {@link useViewOrbitControls}, which orbits/zooms
 * strictly around the fixed patio centre via `lookAt`. Native rotate/tilt/zoom
 * would pivot around the cursor (walking the focus off the patio) and pan/look
 * would fly the camera away, so all five are off; inertia is zeroed so no input
 * coasts. The zoom band ({@link VIEW_MIN_ZOOM_FACTOR}/{@link VIEW_MAX_ZOOM_FACTOR}
 * off the patio's bounding-sphere radius) is still set on the controller: it is
 * the single source of truth for the range clamp, read by both the view-orbit
 * hook and the ViewCube's `clampRange`. Returns a no-op teardown — the hook owns
 * all listeners now.
 */
export const applyInteractionMode = (
    viewer: Viewer,
    interaction: MapInteraction,
    bounds: PatioBounds
): (() => void) => {
    if (interaction === 'edit') return () => {};

    const controller = viewer.scene.screenSpaceCameraController;
    // All native inputs off — the view-orbit hook drives the camera around centre.
    controller.enableRotate = false;
    controller.enableTilt = false;
    controller.enableZoom = false;
    controller.enableTranslate = false;
    controller.enableLook = false;

    // Zero inertia so nothing coasts (the hook applies discrete lookAt moves).
    controller.inertiaSpin = 0;
    controller.inertiaTranslate = 0;
    controller.inertiaZoom = 0;

    // Zoom band around the framed patio — kept as the single source of truth for
    // the range clamp (view-orbit hook + ViewCube `clampRange` both read it).
    const [west, south, east, north] = bounds;
    const { radius } = BoundingSphere.fromRectangle3D(Rectangle.fromDegrees(west, south, east, north));
    controller.minimumZoomDistance = radius * VIEW_MIN_ZOOM_FACTOR;
    controller.maximumZoomDistance = radius * VIEW_MAX_ZOOM_FACTOR;

    return () => {};
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
    /**
     * The patio's authored look-at offset above ground (`Patio.height`), folded
     * into the final framing so the camera aims at the patio's real focal point
     * rather than a spot buried under the tileset mesh.
     */
    height?: number;
    /**
     * Called with the ground elevation sampled under the patio centre, so the
     * camera orbit pivot can reuse this one sample instead of taking its own.
     * Not called when the surface could not be sampled.
     */
    onGroundHeight?: (_height: number) => void;
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
    const { onReady, height = 0, onGroundHeight } = options;

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

    /**
     * Third and final framing pass, once the first LOD has painted and the surface
     * can actually be sampled: re-frame around the patio centre raised to
     * `ground + height`, and publish that ground so the orbit pivot reuses it.
     *
     * The two earlier passes frame at ellipsoid height because no tile has
     * streamed yet — on elevated terrain that aims the camera below the mesh. This
     * corrects it while the loading overlay is still up, so the fix is never seen
     * as a jump. Sampling must never gate the reveal: any failure here just leaves
     * the earlier framing in place, and the caller signals ready regardless.
     */
    const groundFrame = async (): Promise<void> => {
        if (cancelled || viewer.isDestroyed()) {
            return;
        }
        const [west, south, east, north] = bounds;
        const ground = await sampleSurfaceHeight(viewer.scene, (west + east) / 2, (south + north) / 2);
        if (ground === undefined || cancelled || viewer.isDestroyed()) {
            return;
        }
        onGroundHeight?.(ground);
        frameBounds(viewer, bounds, ground + height);
    };

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

            // Cap the tile cache so a long session can't grow the working set
            // unbounded. Without a ceiling, orbiting keeps streaming tiles until
            // memory pressure forces evict→re-fetch→GPU-upload thrash on the main
            // thread — the progressive micro-freezes seen after interacting a while.
            // `cacheBytes` is the steady-state target; overflow tolerates transient
            // spikes during a move before trimming back down. `dynamicScreenSpaceError`
            // relaxes detail on distant tiles, cutting the tile count (and churn).
            tileset.cacheBytes = 512 * 1024 * 1024;
            tileset.maximumCacheOverflowBytes = 256 * 1024 * 1024;
            tileset.dynamicScreenSpaceError = true;

            viewer.scene.primitives.add(tileset);

            // Authoritative re-frame now the canvas is certainly laid out (the
            // synchronous frame above can no-op if the container was still 0-sized
            // when the effect ran, which yields a degenerate frustum aspect). Cheap
            // (duration 0) and idempotent when the sync frame already succeeded.
            frameBounds(viewer, bounds);

            // Fires once when all tiles requested for the framed view have loaded
            // their first LOD — the moment the place is actually rendered, and the
            // first moment the real surface can be sampled.
            removeTilesListener = tileset.initialTilesLoaded.addEventListener(() => {
                void groundFrame().finally(signalReady);
            });
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
const frameBounds = (viewer: Viewer, bounds: PatioBounds, surfaceHeight = 0) => {
    // A 0-sized canvas (effect ran before layout settled) gives the frustum a
    // NaN aspect ratio, which `flyToBoundingSphere` turns into a NaN camera
    // position — the camera ends up nowhere. Skip; the post-tileset re-frame
    // runs once the canvas is laid out.
    if (viewer.canvas.clientHeight === 0 || viewer.canvas.clientWidth === 0) return;

    const [west, south, east, north] = bounds;
    const sphere = BoundingSphere.fromRectangle3D(
        Rectangle.fromDegrees(west, south, east, north),
        undefined,
        surfaceHeight
    );

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
