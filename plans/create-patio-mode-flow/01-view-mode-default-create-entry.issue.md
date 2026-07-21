## What to build

Make view mode the resting state of `/create-patio` and turn create mode into an explicit,
wallet-gated opt-in.

Delete `Header/components/ModeZoomButton/` outright. Replace it with
`Header/components/CreatePatioButton/`, rendered in the header right slot **to the left of**
`GeocoderSearch`: `variant="brand"`, leading plus icon, mirroring
`Home/components/LibraryToolbar/index.tsx`. It is unconditionally enabled with **no zoom gate**, and
renders **only when `mode === 'view'`**. All zoom-sufficiency logic (`isZoomEnough`,
`flyToTargetZoom`) leaves the header — it lands in the popup footer in issue #04.

Gate every create-only overlay on `mode === 'create'`:

- the grid `<path>` in `SquaresOverlay` (and mount `useGridDriver` only in create mode),
- the orange center square group and its clip rect,
- the red intersection layer,
- the low-zoom orange center badge in `ClusterMarkers` (`CREATE_MARKER_KEY`, `data-variant="create"`).

Keep `SquaresOverlay` a single component with a single `useSquaresDriver` — patio geometry is needed
in both modes. Keep writing the `center` entry into `attrsByGeoId` every frame (one rect) so no
branch enters the render loop; only the JSX is conditional.

Wallet gating:

- Pressing `+ Create Patio` while disconnected **opens the RainbowKit connect modal instead of
  switching mode**, and enters create mode automatically once connected. Dismissing does nothing.
- If the wallet disconnects while in create mode, force `mode = 'view'` and clear create state.

Exits from create mode: an X in the popup header (added in #04) and `Escape`. Wire the `Escape`
handler at the module level now, guarded so it only fires in create mode.

Also fix `INTERSECTION.border` in `constants.ts` — it is `'##FF0404'` (double `#`), invalid CSS, so
the stroke never renders.

## Acceptance criteria

- [ ] `ModeZoomButton` is deleted; nothing imports it.
- [ ] `CreatePatioButton` renders left of the search field, `variant="brand"` with a plus icon, only
      when `mode === 'view'`, never zoom-gated or disabled.
- [ ] Fresh load shows view mode: no grid, no center square, no intersection layer, no orange center
      badge, at every zoom level.
- [ ] Entering create mode restores all four of those exactly as they render today.
- [ ] `useGridDriver` is not mounted in view mode.
- [ ] Patio squares, singleton badges, and clusters render identically in both modes.
- [ ] `+ Create Patio` while disconnected opens the connect modal and enters create mode on success;
      dismissing leaves the user in view mode.
- [ ] Disconnecting the wallet while in create mode returns to view mode.
- [ ] `Escape` in create mode returns to view mode; `Escape` in view mode does nothing.
- [ ] Entering create mode clears `selectedPatioId`.
- [ ] `INTERSECTION.border` is a valid hex and the intersection stroke renders.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Nothing.
