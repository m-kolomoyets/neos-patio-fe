## What to build

Make the transition work on direct deep-link / hard refresh of `/patios/$id`, where no patio data is in hand at navigation time. On mount, the provider reads the current router location; if the path matches `/patios/$id` and the transition is not already active, it calls `start()` with a dark background and `Loading…` — painting the overlay before/around the route's suspense window (the route uses `useSuspenseQuery`).

Once the patio query resolves inside the editor module, `update({ backgroundUrl, name })` swaps in the real background image (crossfade) and patio name. The dark background + `Loading…` are the fallback until then.

## Acceptance criteria

- [ ] Hard refresh / direct open of `/patios/$id` shows the overlay immediately on a dark background with `Loading…`
- [ ] No blank flash during the route's suspense/fetch window
- [ ] When the patio query resolves, the real background image and name swap in (crossfade)
- [ ] Provider does not double-activate if the transition was already started via the Home helper
- [ ] Fade-out still driven by the Cesium ready signal (from slice 03) once present

## Blocked by

- Blocked by #02-page-transition-context-overlay
