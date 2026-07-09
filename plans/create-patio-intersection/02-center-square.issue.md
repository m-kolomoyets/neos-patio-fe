## What to build

An absolute SVG overlay above the map that draws the orange center square — the patio being placed. The square is pinned to the viewport center, sized as 100×100m converted to pixels at the current latitude and zoom (so it grows zooming in, shrinks zooming out), and rotated by an azimuth value held in component state (default 34°, no UI control yet). Styling matches Figma: 4px `#ff6a00` border, radial inner gradient (light transparent center → solid `#ff7100` edge, ~0.55 opacity), inset shadow `rgba(161,94,5,0.44)`, 24px rounded corners. The overlay re-syncs on every map `move`/`render` event so the square tracks center smoothly while panning and rescales while zooming.

Introduces the pure meters→pixels helper and the square-geometry helper (center + size + azimuth → rotated rounded rect).

## Acceptance criteria

- [ ] SVG overlay layered above the map, full viewport, pointer-events not blocking map drag.
- [ ] Center square stays pinned to viewport center during pan.
- [ ] Square pixel size derived from 100m at current lat/zoom; visibly rescales on zoom.
- [ ] Square rotated by azimuth from `useState` (default 34°); setter exists for future panel, no UI rendered.
- [ ] Figma styling applied: orange border, radial gradient, inset shadow, 24px corners.
- [ ] Meters→pixels and square-geometry implemented as pure helpers in the module's `utils/`.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-route-mapbox-shell
