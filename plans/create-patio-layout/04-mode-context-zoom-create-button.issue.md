## What to build

Add the screen's mode state and the header's mode/zoom button. Introduce a module-level
`CreatePatioContext` exposing `mode` (`view` | `create`, default `view`) and its setter, mirroring
the `PatioEditor` context convention. Render the toggle button in the header's right slot, driven by
`mode` plus a `zoomEnough` predicate derived from the live camera.

`zoomEnough` is true when `metersToPixels(100, latitude, zoom) >= 0.5 * min(viewportW, viewportH)`.
Button behavior:

- view + not zoomed enough → label "Zoom in" → click flies the camera to the target zoom.
- view + zoomed enough → label "Create patio" → click sets mode to create.
- create (any zoom) → label "Zoom in" → click flies to the target zoom.

The "Zoom in" fly target is the zoom where `metersToPixels(100) = 0.6 * minDim` (above the 0.5
threshold, so the button reliably flips to "Create patio" afterward with no flicker), computed by
inverting `metersToPixels`; center is unchanged; `flyTo` is animated. Both ratios are named
constants.

## Acceptance criteria

- [ ] `CreatePatioContext` provides `mode` + setter, default `view`, consumed by the header button.
- [ ] Button label follows the truth table (view/not-enough → "Zoom in"; view/enough → "Create
      patio"; create → "Zoom in").
- [ ] Clicking "Zoom in" animates the camera to a zoom where a 100 m footprint fills ~60% of the
      shorter viewport dimension; center is preserved.
- [ ] After a "Zoom in" fly from a zoomed-out state, the button flips to "Create patio" (no
      flicker at the boundary).
- [ ] Clicking "Create patio" switches mode to `create` and the button reverts to "Zoom in".
- [ ] 0.5 / 0.6 ratios and the target-zoom inversion are named, pure, and reused (not inlined magic
      numbers).
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-route-surface-header-scaffold
