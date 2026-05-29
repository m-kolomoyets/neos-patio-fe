## What to build

Install `maplibre-gl` and create the `MapCanvas` component inside `PatioEditor`. It mounts a MapLibre instance, applies `setMaxBounds(patio.bounds)`, fits the camera to the bounds' center on mount, and enables 3D pitch + bearing controls. Replace the placeholder editor surface from slice 1 with this map. No three.js overlay yet.

## Acceptance criteria

- [ ] `maplibre-gl` installed via the `npm-audit-install` workflow
- [ ] `src/modules/PatioEditor/components/MapCanvas/` created with `index.tsx` + `styles.module.css`
- [ ] On mount, camera is centered on the patio bounds
- [ ] `setMaxBounds(patio.bounds)` clamps panning — dragging hits a hard edge
- [ ] User can tilt and rotate camera (pitch + bearing enabled)
- [ ] Map fills the editor surface
- [ ] Style URL is a sensible default (e.g. MapLibre demo style or OSM raster) — no API keys required
- [ ] `npm run tsc` and `npm run lint` clean

## Blocked by

- Blocked by `01-patio-types-and-route-shell.issue.md`
