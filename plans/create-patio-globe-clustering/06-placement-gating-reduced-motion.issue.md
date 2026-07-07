## What to build

Gate placement to the placement band and finish the reduced-motion pass, tying the feature to the
existing header **Zoom in** button.

- **Placement gating**: footprint drag/reposition and any create-mode placement interaction are
  enabled only at **z ≥ 17**. Below z17 the map is browse-only — pan, zoom, tap cluster → expand
  (#04), tap patio → select (#04). Derive a `placementEnabled` / zoom-band value from the live camera
  (reuse `useMapCamera`), exposed so the overlay and click handlers gate off it.
- **Zoom-in bridge**: the header mode/zoom button (owned by the layout plan) already flies to
  placement zoom; ensure that from a fully zoomed-out globe state it returns to placement zoom at the
  current center and re-enables placement. If any wiring is needed for it to work from the globe,
  do it here — do not rebuild the button.
- **Reduced-motion audit**: confirm `prefers-reduced-motion` is honored end-to-end — cluster-expand
  flight (#04) jumps, square↔circle morph (#05) snaps, and the globe atmosphere shimmer is disabled.
  Centralize the reduced-motion check if it is currently duplicated.

## Acceptance criteria

- [ ] Below z17 the footprint cannot be moved and create-mode placement is inert; browse gestures and
      marker taps still work.
- [ ] At z ≥ 17 placement/reposition re-enables.
- [ ] From the globe, the header "Zoom in" button returns to placement zoom at the current center and
      re-enables placement (button itself not rebuilt).
- [ ] `prefers-reduced-motion` is honored across flight, morph, and atmosphere, via a single shared
      check.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #04-cluster-expand-singleton-select
- Blocked by #05-square-circle-morph-handoff
