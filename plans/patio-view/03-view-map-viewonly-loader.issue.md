## What to build

Mount the shared Cesium map on the View page in view-only mode, with the loading overlay.

- View module renders `CesiumViewerProvider` → `CesiumMap bounds={patio.bounds} interaction="view"` + idle rotation, inside the surface's map region.
- View-only camera constraints: orbit + zoom + limited pan around the patio center; free translate/fly disabled; camera cannot leave the framed patio. Idle rotation resumes when idle.
- Reuse the existing shared `PageTransitionOverlay`: View feeds it the patio's preview background + name; the shared `CesiumMap` already signals ready on first-tiles-settled to clear it.
- Widen the page-transition self-activation path matcher so it matches both `/patios/$id/` (view) and `/patios/$id/edit` (editor).

## Acceptance criteria

- [ ] `/patios/<id>/` shows the photorealistic 3D terrain map framed on the patio.
- [ ] Camera: orbit + zoom + limited pan work; free-fly away from center is impossible.
- [ ] Idle rotation kicks in when the user stops interacting.
- [ ] Loading overlay shows the patio preview background + name on deep-link/refresh, then clears once tiles settle.
- [ ] Browser-back mid-load clears the overlay immediately (no lingering overlay on next page).
- [ ] Overlay still fires on `/patios/<id>/edit`.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #plans/patio-view/01-route-split-view-skeleton.issue.md
- Blocked by #plans/patio-view/02-promote-cesium-shared.issue.md
</content>
