## What to build

Enable azimuth-only map rotation and make the squares honor it. Turn on Mapbox bearing rotation
(`dragRotate`) while locking the camera top-down — `pitchWithRotate={false}`, `maxPitch={0}`, and
touch-pitch disabled — so the only permitted camera rotation is bearing.

Expose `bearing` from `useMapCamera`. The center square is always drawn axis-aligned in screen space
(looks like an upright, unrotated square regardless of bearing), but its semantic bounds azimuth
equals the live map bearing. Existing patio squares are geo-anchored, so their screen azimuth becomes
`worldAzimuth − bearing`, keeping them pinned to the real world and visually rotating as the map
rotates. `useAzimuth` becomes derived from the map bearing and the manual azimuth setter is dropped.

## Acceptance criteria

- [ ] Map can be rotated by bearing (drag-rotate); pitch/tilt is locked at top-down and cannot be
      changed by any gesture.
- [ ] `useMapCamera` exposes the current `bearing`.
- [ ] Center square stays visually upright (axis-aligned) at every bearing; its bounds azimuth tracks
      the live bearing.
- [ ] Existing patio squares rotate with the world as bearing changes (screen azimuth =
      `worldAzimuth − bearing`) and stay anchored to their coordinates.
- [ ] Intersection/collision rendering stays correct as the map rotates.
- [ ] `useAzimuth` no longer exposes a manual setter; azimuth derives from bearing.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-route-surface-header-scaffold
