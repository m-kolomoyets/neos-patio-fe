## What to build

Give view mode its payoff: a bottom-right details popup for the selected patio. `selectedPatioId`
already exists in `CreatePatioContext` and is written by both selection paths but read by nothing —
this is what consumes it.

Extract a shared **`MapPopup`** shell under `src/modules/CreatePatio/components/MapPopup/`: the
300px card frame, header row with optional X, and a label/value row list. Both this popup and the
new-patio popup (#04) use it — the two Figma frames share identical row typography and card metrics.
Position it bottom-right inside `.map-clip`; only one popup can exist at a time.

Build **`PatioDetailsPopup`**:

- Thumbnail (`previewHighUrl`), name, and a location line `<continent> • <lat>, <lng>` (5dp).
- Collapsed rows: Owner, Status (colored dot + label from `isPublished`), Blockchain Link,
  Navigation Link.
- A `View More` / `View Less` toggle (local `useState`, collapsed by default) revealing two more
  rows: Azimuth and When created.
- A `View Patio` brand button → `navigate({ to: '/patios/$id', params: { id } })`.

Add optional `blockchainLink?: string` and `navigationLink?: string` to `Patio` and populate a few
fixtures. **Omit a row entirely when its value is undefined** — never render an empty value. Both
link rows are copy-to-clipboard chips with middle truncation (`417/0xD...277`).

Selection behavior:

- **Square hit-test** → select, fly the camera to the patio, open the popup.
- **Singleton badge tap** → select, fly to `SINGLE_PATIO_VIEW_ZOOM`, open the popup (it stays open
  through the flight).
- **Cluster badge tap** → expand only; no selection, no popup.
- **Miss on the hit-test** → clear selection, close the popup.
- **Clicking a patio while in create mode** → set `mode = 'view'` and select, but perform **no camera
  move**.

Detail data comes from `getPatioQueryOptions(selectedPatioId)`; render a skeleton while it resolves
so the popup doesn't pop in late.

## Acceptance criteria

- [ ] `MapPopup` is a reusable shell (frame + header + optional X + row list) with no patio-specific
      logic.
- [ ] The popup sits bottom-right inside the map surface and never overlaps the Action Bar on
      desktop.
- [ ] Clicking a patio square selects it, flies the camera to it, and opens the details popup.
- [ ] Tapping a singleton badge selects, flies to `SINGLE_PATIO_VIEW_ZOOM`, and opens the popup.
- [ ] Tapping a cluster expands it and opens nothing.
- [ ] Clicking empty map clears the selection and closes the popup.
- [ ] Clicking a patio while in create mode switches to view mode, selects it, and does **not** move
      the camera.
- [ ] Collapsed shows exactly four rows; `View More` reveals Azimuth and When created and the label
      flips to `View Less`.
- [ ] A patio without `blockchainLink` / `navigationLink` renders no row for it (not an empty one).
- [ ] Link chips copy to clipboard and show truncated middle text.
- [ ] `View Patio` navigates to `/patios/$id` for the selected patio.
- [ ] A skeleton renders while the detail query is in flight.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-view-mode-default-create-entry
- Blocked by #02-indicator-palette-and-states
