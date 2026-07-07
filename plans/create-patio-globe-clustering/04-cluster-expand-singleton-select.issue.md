## What to build

Make the DOM markers interactive.

- **Cluster tap**: read the cluster's expansion zoom via the source's `getClusterExpansionZoom`
  (supercluster), then `flyTo` that zoom centered on the cluster's coordinates. The bubble breaks
  into smaller clusters / individual patios after the flight.
- **Singleton tap**: select that patio, reusing the existing patio-selection path (the same selection
  triggered by clicking an existing patio square in placement mode). Detail/popup content stays
  deferred — selection only.
- Respect `prefers-reduced-motion`: the cluster-expand flight is an instant jump (no easing) when
  reduced motion is requested.
- Keyboard/focus: markers are real interactive elements (button semantics), focusable and
  activatable, per the project accessibility conventions.

## Acceptance criteria

- [ ] Tapping a cluster flies the camera to its expansion zoom, centered on it, and the cluster
      visibly breaks apart.
- [ ] Tapping a lone patio selects it via the existing selection mechanism (no new detail UI).
- [ ] With `prefers-reduced-motion`, cluster expansion is an instant jump.
- [ ] Markers are keyboard-focusable and activatable with correct button semantics.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #03-cluster-singleton-dom-markers
