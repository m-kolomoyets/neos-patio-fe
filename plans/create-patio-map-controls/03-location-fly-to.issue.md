## What to build

Wire up the location button so it flies the camera to the user's real-world GPS position, with full browser-permission handling.

- New `useGeolocateToMap()` hook encapsulating: `navigator.geolocation.getCurrentPosition`, permission state via `navigator.permissions.query({ name: 'geolocation' })`, a loading state, and the resulting `flyTo`. Exposes something like `{ request, status, isDenied }`.
- On location button click: request current position; on success `map.flyTo({ center: [lng, lat], zoom: ~16 })` (street-level — user sees their actual property). Camera move only, no marker.
- If permission is denied, the button is **reactively disabled** (from the Permissions API), so it stops prompting.
- On timeout / position-unavailable, show a Toast (`src/components/ui/Toast`) e.g. "Location unavailable".
- While fetching, the button shows a loading/disabled state.
- Reduced-motion gating: the `flyTo` uses `duration: 0` when `prefersReducedMotion()` is true, eased otherwise.

## Acceptance criteria

- [ ] Clicking location (first time) triggers the browser permission prompt.
- [ ] On grant, the map flies to the user's GPS coordinate at ~zoom 16.
- [ ] On denied permission, the location button becomes disabled and does not re-prompt.
- [ ] On timeout/unavailable, a Toast is shown and the button returns to idle.
- [ ] While the position is being fetched, the button shows a loading/disabled state.
- [ ] With reduced-motion enabled, the move to the location is instant.
- [ ] `pnpm tsc` and `pnpm lint` pass.

## Blocked by

- Blocked by #01-bar-scaffold-zoom (needs `MapControls` bar + `useCreatePatioMap()` + the location button placeholder/icon).
