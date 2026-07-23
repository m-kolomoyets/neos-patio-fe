## What to build

Simplify Patio View's camera-interaction setup so view mode disables Cesium's
native camera controller entirely and drops the obsolete pan-drift machinery.

In `applyInteractionMode('view')` (sceneBootstrap): disable all native camera
inputs (`enableRotate`, `enableTilt`, `enableZoom`, `enableTranslate`,
`enableLook` → `false`), zero the inertias, and keep setting the zoom band
(`minimumZoomDistance`/`maximumZoomDistance`) as the shared source of truth for the
zoom clamp. Remove `installPanClamp`, `VIEW_MAX_PAN_METERS`, and `VIEW_MAX_PITCH`.
The function returns a no-op teardown. `'edit'` mode stays exactly as-is.

After this slice the view map no longer drifts or snaps back — it is inert (orbit
and zoom are restored in later slices). This is the structural reframe: no more
"free-drift-then-clamp".

## Acceptance criteria

- [ ] `applyInteractionMode('view')` sets all five native input flags to `false` and zeros inertias
- [ ] Zoom band (`minimumZoomDistance`/`maximumZoomDistance`) still set on the controller
- [ ] `installPanClamp`, `VIEW_MAX_PAN_METERS`, `VIEW_MAX_PITCH` removed; no references remain
- [ ] No pan-drift and no snap-back correction occur in view mode
- [ ] `'edit'` mode camera behavior unchanged
- [ ] Tests cover the view-mode controller setup (flags, band, no listeners installed)
- [ ] `pnpm tsc` and lint pass

## Blocked by

None - can start immediately.
