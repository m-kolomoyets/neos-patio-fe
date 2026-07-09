## What to build

A new `/create-patio` route that renders a `CreatePatio` module showing a full-screen top-down satellite map. The map uses Mapbox via `react-map-gl/mapbox` (new `mapbox-gl` dependency) with the `satellite-streets-v12` style, opens centered on a hardcoded start coordinate (Barcelona) at street-level zoom (~16), and pans/zooms normally. A new `VITE_MAPBOX_TOKEN` env var is wired into `vite-env.d.ts` and mirrored in `envSchema`; the developer supplies the token.

This is the tracer-bullet shell: route → module → live map, with nothing drawn on top yet.

## Acceptance criteria

- [ ] `create-patio.lazy.tsx` route exists and renders the `CreatePatio` module (route imports no components/ui directly; module takes no props).
- [ ] `mapbox-gl` added as a dependency; map rendered with `react-map-gl/mapbox`, `satellite-streets-v12` style.
- [ ] Map opens at the Barcelona start coordinate, zoom ~16, top-down (no pitch), and supports pan + zoom.
- [ ] `VITE_MAPBOX_TOKEN` declared in `vite-env.d.ts` and added to `envSchema`; map reads it from env.
- [ ] Start coordinate, default zoom, and 100m square constant live in the module's `constants.ts`.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
