## What to build

The create-mode counterpart to the details popup: a `NewPatioPopup` that is **always present while
`mode === 'create'`**, built on the `MapPopup` shell from #03. This issue covers the idle popup and
its zoom gate; the mint state machine lands in #05.

Content:

- Header: title `New Patio` + X (X exits create mode).
- Location line `<continent> • <lat>, <lng>`, live-bound to map center.
- Rows:
  - **Owner** — `useAccount()` address, truncated; `Neos` fallback.
  - **Size** — derived, `PATIO_SIZE_M ** 2` → `10 000 m2`.
  - **Azimuth** — real and live. The center square is drawn screen-upright
    (`useSquaresDriver.ts`, `azimuthDeg: 0`), so its geographic azimuth is
    `-getProjectedNorthDeg(map)`. Subscribe to map `render` and update as the user rotates.
  - **Price** — `340 NCR` with a `~$10` sub-line.
  - **Status** — `Draft`.
  - **ID Estimate** — `patios.length + 1`.
- Price, status, and the ID-estimate strategy are named constants in `constants.ts` with a `TODO`
  pointing at the future contract.

Footer zoom gate — this is where the deleted `ModeZoomButton` logic lands:

- `zoomEnough = isZoomEnough(PATIO_SIZE_M, latitude, zoom, minViewportDimension(...), ZOOM_ENOUGH_RATIO)
  && zoom >= PLACEMENT_MIN_ZOOM`.

  The ratio gate alone is not enough: it can read "enough" while the camera is still below
  `CROSSFADE_BAND.min`, i.e. before the grid and center square are drawn, which would offer a mint
  for a footprint the user cannot see.
- Below the gate → `Zoom In` (surface variant, magnifier icon), flying to
  `max(zoomForFootprint(PATIO_SIZE_M, latitude, ZOOM_IN_TARGET_RATIO * minDim), PLACEMENT_MIN_ZOOM)`
  so one press always lands in a mintable state. `jumpTo` under reduced motion, as today.
- At or above the gate → `Create Patio` (brand variant). Wired to a no-op in this issue.
- The button **never disables** — it always does something.

Only one bottom-right popup exists at a time: entering create mode clears `selectedPatioId`, and
selecting a patio (#03) leaves create mode.

Live-updating coords and azimuth must not re-render the whole popup per frame — write them
imperatively into their row nodes via the same driver pattern used elsewhere, or throttle to a
sensible cadence.

## Acceptance criteria

- [ ] `NewPatioPopup` renders whenever `mode === 'create'` and never in view mode.
- [ ] It reuses the `MapPopup` shell; the details popup and it never render simultaneously.
- [ ] Coordinates and azimuth update live as the map is panned and rotated.
- [ ] Size reads `10 000 m2`, derived from `PATIO_SIZE_M`, not hardcoded.
- [ ] Owner shows the truncated connected address, `Neos` when unavailable.
- [ ] Price, Status, and ID Estimate render per Figma and come from named constants.
- [ ] Zoomed far out, the footer reads `Zoom In`; one press lands at a zoom where the grid and center
      square are drawn **and** the footer now reads `Create Patio` — no flicker at the boundary.
- [ ] The footer button is never disabled.
- [ ] The X exits create mode.
- [ ] Panning/rotating does not re-render the popup component tree every frame.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-view-mode-default-create-entry
- Blocked by #03-map-popup-shell-and-patio-details
