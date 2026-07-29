## What to build

The foundation slice for the Create-Patio map control bar. Adds a compact vertical control bar in the **bottom-left** corner of the Create-Patio Mapbox map, containing the magnet button (no-op placeholder), the location button (present but inert until slice #3), and a working zoom **+ / −** group.

This slice establishes the shared plumbing the later slices build on: the `MapControls` presentational component and the `useCreatePatioMap()` hook that resolves the underlying Mapbox map instance.

- New component `src/modules/CreatePatio/components/MapControls/`, mounted as a sibling of `<Map>` inside `.map-clip`, positioned `position: absolute; left/bottom: var(--gap-2)`.
- Layout mirrors Figma: vertical stack (magnet → location → zoom +/− group) with the bottom rotate/compass row reserved (added in slice #2). Uses `ui/Button` (`isIcon`, `variant="surface"`) in `surface-regular` pill wrappers.
- `useCreatePatioMap()` hook wrapping `(useMap().current ?? useMap()[CREATE_PATIO_MAP_ID])?.getMap()`.
- Magnet button: renders with the new `magnet_24.svg` icon; `onClick` is a no-op.
- Location button: renders with the new `location_24.svg` icon; inert placeholder here (wired in #3).
- Zoom: `map.zoomIn()` / `map.zoomOut()`, respecting existing `minZoom`.
- Download `magnet_24.svg` (UI-kit node `9080-36`) and `location_24.svg` (UI-kit node `9080-351`) into `src/icons/`.

## Acceptance criteria

- [ ] Control bar renders in the bottom-left of the Create-Patio map, visible from the initial globe view.
- [ ] Bar does not overlap the ScaleBar (top-left) or MapViewTabs (top-center).
- [ ] Magnet and location buttons are present with correct icons; magnet click does nothing, location click does nothing (yet).
- [ ] Zoom + zooms the map in; zoom − zooms out; both eased and respect `minZoom`.
- [ ] `useCreatePatioMap()` returns the live Mapbox map instance.
- [ ] `pnpm tsc` and `pnpm lint` pass.

## Blocked by

- None - can start immediately.
