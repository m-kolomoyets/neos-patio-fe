## What to build

Wire Cesium's static runtime assets into the Vite build so a Cesium scene can render at all.
Add `vite-plugin-cesium` to the existing Vite plugin array (it copies Cesium's
Workers/Assets/Widgets/ThirdParty, sets `CESIUM_BASE_URL`, and injects the Widgets CSS). Verify it
is compatible with the project's Vite major; if not, fall back to `vite-plugin-static-copy` plus a
manually-defined `CESIUM_BASE_URL` and a manual Widgets CSS import.

Environment variables are already renamed by hand (`VITE_CESIUM_ACCESS_TOKEN`,
`VITE_GOOGLE_MAPS_API_KEY` present in `envSchema` and `vite-env.d.ts`) — no env work needed here.

This slice produces no user-visible UI yet; it is the build-layer tracer that makes every later
Cesium slice possible.

## Acceptance criteria

- [ ] `vite-plugin-cesium` (or the static-copy fallback) added to `vite.config.ts`
- [ ] `npm run build` completes and Cesium Workers/Assets/Widgets are present in `dist/`
- [ ] `npm run dev` boots with no missing-worker / `CESIUM_BASE_URL` console errors
- [ ] A throwaway smoke check (e.g. importing `cesium` and constructing a `Viewer` on a temp div) renders without asset 404s, then is removed
- [ ] `npm run tsc` and `npm run lint` pass
- [ ] No regression to the existing (still-MapLibre) editor

## Blocked by

None - can start immediately.
