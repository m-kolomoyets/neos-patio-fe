import type { PatioBounds } from '@/services/patios/types';
import { BoundingSphere, Cesium3DTileset, Math as CesiumMath, HeadingPitchRange, Ion, Rectangle, Viewer } from 'cesium';

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
 * Create the editor Viewer against `container` with the editor's fixed config:
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
 * Fallback delay after which the scene is reported "ready" even if the tileset
 * never settles, so a loading overlay waiting on {@link bootstrapScene} can never
 * get stuck.
 */
const READY_TIMEOUT_MS = 5000;

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
