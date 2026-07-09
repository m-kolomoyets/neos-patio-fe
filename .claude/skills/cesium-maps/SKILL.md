---
name: cesium-maps
description: Work with the CesiumJS 3D map in this repo — creating/configuring the Viewer, Google Photorealistic 3D Tiles, camera moves (flyTo/lookAt/HeadingPitchRange), placing glTF models, geo↔local (ENU/ECEF) conversions, picking, surface-height sampling, and requestRenderMode render pumping. Use when adding or editing map features, camera controls, the ViewCube, object placement/gizmos, or anything importing from `cesium`, touching `CesiumMap`, `sceneBootstrap`, `useCesiumCamera`, `geoPlacement`, or `CesiumViewerContext`.
---

# Cesium Maps

CesiumJS `^1.142`. No react wrapper — `Viewer` is created imperatively and held in React context. Read [REFERENCE.md](REFERENCE.md) for the full API/patterns catalog before non-trivial work.

## Architecture (one Viewer, shared)

- `CesiumMap` (`src/components/CesiumMap/`) owns the single `Viewer`: creates it in a `useEffect` against a container ref, registers it in `CesiumViewerContext`, loads tiles, frames bounds, tears down on unmount.
- `CesiumViewerProvider` / `useCesiumViewer()` (`src/contexts/CesiumViewerContext.tsx`) — single-instance registry (mirrors react-map-gl `useMap()`). Widgets (ViewCube) read the Viewer back; returns `null` until mounted.
- Camera logic lives in hooks/utils, NOT components: `useCesiumCamera` (ViewCube adapter), `useOrbitTarget`, `useIdleRotation`, `cameraMath.ts` (pure), `geoPlacement.ts` (geo↔local + model matrices), `flyToObject`, `sampleSurfaceHeight`.

## Load-bearing rules

1. **`requestRenderMode: true`** — scene renders only on change. EVERY camera/scene mutation MUST end with `scene.requestRender()`. Animated flights render nothing unless you pump `requestRender()` per frame for the flight duration (`pumpRenderDuringFlight` pattern — copy it, it's folder-scoped and duplicated on purpose).
2. **No globe** — `scene.globe.show = false`; world geometry is the Google P3DT tileset (`Cesium3DTileset.fromIonAssetId(2275207)`). Depth/occlusion comes from the tileset only.
3. **Teardown** — check `viewer.isDestroyed()` before touching a Viewer after any `await`; cancel in-flight tileset loads and remove event listeners in the effect cleanup.
4. **Import from `cesium`** (bare) — e.g. `import { Viewer, Cartesian3, Math as CesiumMath } from 'cesium'`. Import widget CSS `import 'cesium/Build/Cesium/Widgets/widgets.css'`. Assets served from `/cesium` via `CESIUM_BASE_URL` (vite static-copy) — don't add `vite-plugin-cesium`.
5. **Env** — `VITE_CESIUM_ACCESS_TOKEN` → `Ion.defaultAccessToken` at module load (in `sceneBootstrap`). Mirror new env vars in `vite-env.d.ts` + `envSchema`.

## Camera model

Every move = `lookAt(target, HeadingPitchRange)` around the patio bounds centre sampled to surface height (`useOrbitTarget`). Animated → `camera.flyToBoundingSphere(sphere, { offset, duration })` + render pump. Instant → `camera.lookAt(t, offset)` then `camera.lookAtTransform(Matrix4.IDENTITY)` to release the frame so default controls stay free. Cancel a running tween with `camera.cancelFlight()` before a drag.

Display↔Cesium unit conversions are pure fns in `cameraMath.ts`: bearing↔heading, display-pitch (0=top-down)↔Cesium-pitch (-90=down). Reuse them — don't re-derive.

## Common tasks → where to look

| Task | Reference |
|------|-----------|
| Create/configure Viewer, widgets off | `sceneBootstrap.ts` `configureViewer` |
| Load tiles, frame bounds, ready signal | `sceneBootstrap.ts` `bootstrapScene`/`frameBounds` |
| Constrain camera (orbit+zoom only) | `sceneBootstrap.ts` `applyInteractionMode` |
| Camera moves / drag-orbit / zoom | `useCesiumCamera.ts` |
| Place/update/select glTF model | `ObjectModel/index.ts` |
| Geo ↔ local meters, model matrices | `geoPlacement.ts` |
| Pick ground point / surface height | `geoPlacement.ts` `pickGroundPoint`, `sampleSurfaceHeight.ts` |

Official docs: https://cesium.com/learn/cesiumjs/ref-doc/ · Sandcastle examples: https://sandcastle.cesium.com/
