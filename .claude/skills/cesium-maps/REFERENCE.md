# Cesium Reference — patterns from this repo

All snippets are the actual conventions in `neos-patio`. Prefer copying these over generic Sandcastle code.

## 1. Viewer creation (`sceneBootstrap.ts::configureViewer`)

```ts
const viewer = new Viewer(container, {
    requestRenderMode: true,            // render on change only
    maximumRenderTimeChange: Infinity,
    contextOptions: { webgl: { stencil: true } }, // needed for Model silhouette
    baseLayer: false,                   // no base imagery — tileset is the world
    baseLayerPicker: false, geocoder: false, timeline: false, animation: false,
    homeButton: false, sceneModePicker: false, navigationHelpButton: false,
    fullscreenButton: false, selectionIndicator: false, infoBox: false,
});
viewer.scene.globe.show = false;
// Leave the credit container visible — imagery ToS requires attribution.
```

`Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ACCESS_TOKEN` once at module load. Not required for Google P3DT (Google-key auth) but silences demo-token warnings and keeps ion assets available.

## 2. requestRenderMode — THE gotcha

Scene only redraws on change. Two rules:

- After any imperative camera/scene mutation: `viewer.scene.requestRender()`.
- Animated flights (`flyTo`, `flyToBoundingSphere`) advance across frames — under demand rendering nothing draws unless you request a render each frame for the flight's duration:

```ts
const pumpRenderDuringFlight = (viewer: Viewer, durationMs: number) => {
    let elapsed = 0, last: number | null = null;
    const tick = (ts: number) => {
        if (viewer.isDestroyed()) return;
        if (last !== null) elapsed += ts - last;
        last = ts;
        viewer.scene.requestRender();
        if (elapsed < durationMs) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};
```

This helper is duplicated in `useCesiumCamera.ts` and `flyToObject.ts` on purpose — hooks/utils are folder-scoped and can't import across modules. Copy it locally; don't promote unless genuinely cross-cutting.

## 3. Google Photorealistic 3D Tiles (`bootstrapScene`)

```ts
const tileset = await Cesium3DTileset.fromIonAssetId(2275207); // Google P3DT asset id
if (cancelled || viewer.isDestroyed()) return;                 // guard post-await
tileset.showCreditsOnScreen = true;                            // ToS: on-screen attribution
viewer.scene.primitives.add(tileset);
// initialTilesLoaded fires once the framed view's first LOD is in — "place is rendered"
const remove = tileset.initialTilesLoaded.addEventListener(onReady);
```

Always pair with a `setTimeout` safety net (`READY_TIMEOUT_MS = 8000`) so a loading overlay can't get stuck, and a `cancelled` flag returned as teardown.

## 4. Framing bounds (`frameBounds`)

Use `flyToBoundingSphere`, NOT `flyTo({ destination: Rectangle })`. A Rectangle destination fits top-down then overrides orientation in place → camera parks over centre looking off into space. Sphere always looks at centre:

```ts
const sphere = BoundingSphere.fromRectangle3D(Rectangle.fromDegrees(w, s, e, n));
viewer.camera.flyToBoundingSphere(sphere, {
    offset: new HeadingPitchRange(0, CesiumMath.toRadians(-45), 0), // heading, pitch, range(0=auto-fit)
    duration: 0,
});
viewer.scene.requestRender();
```

`range: 0` lets Cesium derive the fitting distance from the sphere radius.

## 5. Camera moves (`useCesiumCamera.ts`)

Model: `lookAt(orbitTarget, HeadingPitchRange(heading, pitch, range))`.

```ts
// animated
camera.flyToBoundingSphere(new BoundingSphere(orbitTarget, 0), { offset, duration });
pumpRenderDuringFlight(viewer, durationMs);

// instant (drag): apply then release the reference frame so default controls stay free
camera.cancelFlight();
camera.lookAt(orbitTarget, offset);
camera.lookAtTransform(Matrix4.IDENTITY);
scene.requestRender();
```

Read live camera: `camera.heading`, `camera.pitch`, `camera.positionWC`. Distance to target: `Cartesian3.distance(camera.positionWC, target)`. Fit-to-viewport range from a bounding sphere: `radius / Math.tan(fovy / 2)` (frustum `fovy` guard: `'fovy' in camera.frustum`).

## 6. Constrain interaction (`applyInteractionMode` — orbit+zoom only)

```ts
const c = viewer.scene.screenSpaceCameraController;
c.enableTranslate = false; c.enableLook = false;        // no pan/free-look
c.enableRotate = true; c.enableZoom = true; c.enableTilt = true;
c.inertiaSpin = 0; c.inertiaTranslate = 0; c.inertiaZoom = 0; // kill coasting → no jitter vs clamp
c.minimumZoomDistance = radius * 0.6;
c.maximumZoomDistance = radius * 3;
```

`minimum/maximumZoomDistance` only gate wheel zoom by default — clamp stepper/preset ranges yourself with `CesiumMath.clamp(range, min, max)`. A pan-clamp listener on `camera.changed` (set `camera.percentageChanged = 0.05`) snaps position back onto a disc in the centre's ENU frame; move `camera.position` only (not `setView`) to avoid fighting the active drag.

## 7. Geo ↔ local coordinates (`geoPlacement.ts`)

ECEF = earth-fixed cartesian; ENU = east-north-up meters from an origin. Build the frame once per patio (origin = bounds centre):

```ts
const origin = Cartesian3.fromDegrees(lng, lat, 0);
const toFixed = Transforms.eastNorthUpToFixedFrame(origin);          // ENU → ECEF
const toLocal = Matrix4.inverse(toFixed, new Matrix4());             // ECEF → ENU
// point → local meters
Matrix4.multiplyByPoint(toLocal, Cartesian3.fromDegrees(lng, lat, h), new Cartesian3());
// geographic ↔ cartographic
const carto = Cartographic.fromCartesian(ecef);  // .longitude/.latitude in RAD, .height in m
CesiumMath.toDegrees(carto.longitude);
```

Model matrix from a geo+HPR pose:
```ts
const m = Transforms.headingPitchRollToFixedFrame(origin, new HeadingPitchRoll(h, p, r));
Matrix4.multiplyByUniformScale(m, scale, m);      // apply uniform scale in place
// inverse: Matrix4.getTranslation, Transforms.fixedFrameToHeadingPitchRoll, Matrix4.getScale
```

## 8. Placing glTF models (`ObjectModel/index.ts`)

```ts
const model = await Model.fromGltfAsync({
    url: gltfUrl,
    modelMatrix: geoPoseToModelMatrix(pose),
    id: { editorObjectId: object.id },   // scene.pick reads this back → distinguish from tileset
});
if (disposed) { model.destroy(); return; }
scene.primitives.add(model);
onReady();                               // request render under demand mode
// move: model.modelMatrix = geoPoseToModelMatrix(next)
// select outline: model.silhouetteColor = Color.WHITE; model.silhouetteSize = 2 (needs stencil buffer)
// remove: scene.primitives.remove(model) — destroys by default
```

Load is async — buffer the latest pose/selection and apply on resolve; guard with a `disposed` flag.

## 9. Picking & surface height

```ts
// exact rendered-surface hit (depth buffer) with ellipsoid fallback
let c = scene.pickPositionSupported ? scene.pickPosition(windowPos) : undefined;
c = c ?? scene.camera.pickEllipsoid(windowPos, Ellipsoid.WGS84);

// what did I click? — reads the model id from §8
const picked = scene.pick(windowPos); // picked?.id?.editorObjectId

// async: sample real surface height at lng/lat, loading detail tiles
const [s] = await scene.sampleHeightMostDetailed([Cartographic.fromDegrees(lng, lat)], objectsToExclude);
s?.height;
```

`pickPosition` is one-shot & exact (best for spawn-at-cursor); `sampleHeightMostDetailed` is async & loads tiles (best for re-grounding on drag-end / resolving the orbit target). `objectsToExclude` stops a dragged model sampling its own mesh.

## 10. Idle orbit (`useIdleRotation.ts`)

RAF loop advances `camera.heading` ~3°/s around a pivot captured at orbit start (screen-centre ground hit, fallback bounds centre); pitch+range held constant. Runs only while orbiting, `requestRender()` per frame. Detect user interaction via window-capture DOM events (`pointerdown`,`wheel`,`touchstart`,`keydown`, + `pointermove` only while a button is held) so it catches overlay widgets and the orbit's own `lookAt` (emits no DOM events) can't feed itself.

## 11. Vite/build notes

- Assets (`Workers`, `Assets`, `Widgets`, `ThirdParty`) copied to `/cesium` via `vite-plugin-static-copy`; `define.CESIUM_BASE_URL = '/cesium'`. Don't add `vite-plugin-cesium`.
- Bare `cesium` aliased to `node_modules/cesium/Build/Cesium/index.js` (avoids a Source/Cesium.js resolve blowup). Deep imports like widget CSS pass through.
- `cesium` is split into its own `vendor-cesium` manual chunk.

## Docs

- API ref: https://cesium.com/learn/cesiumjs/ref-doc/
- Sandcastle (live examples): https://sandcastle.cesium.com/
- 3D Tiles / Google P3DT: https://cesium.com/learn/3d-tiling/photorealistic-3d-tiles/
