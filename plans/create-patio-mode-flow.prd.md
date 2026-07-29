# Create Patio Mode Flow Rework — PRD

## Problem Statement

The Create Patio screen (`/create-patio`) currently makes *placement* the default posture of the
map. A single header button (`ModeZoomButton`) conflates two unrelated jobs — "the camera is too far
out, zoom in" and "start creating" — so its label flips as the user zooms, and the placement chrome
(center square, pinned grid, red intersection, orange center badge) is always on screen regardless
of intent. A user who only wants to browse existing patios cannot: the reticle follows them
everywhere and the grid is always drawn.

Worse, the screen has no payoff. `selectedPatioId` is written by both selection paths and read by
nothing — clicking a patio does nothing visible. There is no patio detail popup, no new-patio
summary, no create action, and no minting. Every patio square renders the same flat blue regardless
of whether it is published or owned by the connected wallet, so the map carries no information about
the state of the world it is showing.

## Solution

Make **view mode the default and the resting state** of the screen, and make **create mode an
explicit, wallet-gated thing the user opts into** — then give both modes a real bottom-right popup.

- **View mode (default).** No center cursor, no grid, no intersection layer. Just the map: clusters,
  badges, and patio squares. Clicking a patio selects it, flies the camera to it, and opens a
  **patio details popup** at the bottom right with a `View Patio` action into `/patios/$id`.
- **Create mode.** Entered only via a new `+ Create Patio` button in the header, left of the search
  field. Restores exactly today's placement chrome — center cursor, grid pinned to the center
  square, intersection paint. A **new-patio popup** is always present at the bottom right showing
  live coordinates, azimuth, size, price, and status.
- **Minting lives in that popup's footer**, not in a modal. When the camera is too far out the
  footer reads `Zoom In`; once close enough it reads `Create Patio` and drives a three-phase web3
  transaction (`Payment Requested` → `Waiting for Confirmation` → `Waiting for Oracle`) ending in a
  success banner with `View` and `Create Another Patio`.
- **The map becomes informative.** Patio squares and singleton badges adopt the design system's
  `Indicator` palette — four colors derived from published × owned-by-connected-wallet — with
  hover/pressed/selected states. Clusters stay two-color: blue when any member is unpublished, green
  otherwise.
- **Wallet gates the whole create path.** A disconnected user lands in view mode and cannot leave
  it; pressing `+ Create Patio` opens the RainbowKit connect modal and continues into create mode
  on success.

## User Stories

1. As a browsing user, I want the map to open in view mode with no placement reticle or grid, so
   that I can look at patios without the UI insisting I'm about to create one.
2. As a browsing user, I want to click a patio square and have the camera fly to it, so that I get a
   close look at what I selected.
3. As a browsing user, I want a details popup at the bottom right for the selected patio, so that I
   can see its owner, status, and links without leaving the map.
4. As a browsing user, I want to expand that popup for more detail (azimuth, creation date), so that
   the default card stays compact.
5. As a browsing user, I want a `View Patio` button in the popup, so that I can open the full patio
   view.
6. As a browsing user, I want the selected patio visually marked on the map, so that I know which
   square the popup describes when several are on screen.
7. As a user, I want patio squares colored by whether they are published and whether I own them, so
   that I can read the state of an area at a glance.
8. As a user, I want cluster badges colored blue when they contain anything unpublished and green
   otherwise, so that I can spot in-progress areas while zoomed out.
9. As a user, I want squares to respond to hover and press, so that the map feels interactive and I
   know what I'm about to click.
10. As a creator, I want a `+ Create Patio` button in the header, so that entering create mode is an
    explicit decision rather than a side effect of zooming.
11. As a creator, I want create mode to restore the center cursor and grid, so that I can see
    exactly where the new patio will land.
12. As a creator, I want a new-patio popup showing live coordinates, azimuth, size, price and ID
    estimate, so that I know what I am about to mint as I move the map.
13. As a creator zoomed too far out, I want the popup footer to read `Zoom In` and take me to a
    workable zoom in one press, so that I'm never asked to mint something I can't see.
14. As a creator, I want pressing `Create Patio` to start a real wallet transaction and show me its
    progress through payment, confirmation, and oracle phases, so that I understand the wait.
15. As a creator, I want the footprint to freeze at the moment I press create, so that panning
    during the wait never changes what is being minted.
16. As a creator, I want to keep panning the map during the wait, so that a multi-phase transaction
    doesn't lock the screen.
17. As a creator, I want a clear success banner naming the minted token, with `View` and
    `Create Another Patio`, so that I can immediately continue in either direction.
18. As a creator whose transaction fails or who rejects it in the wallet, I want a clear error and a
    `Try Again` that reuses the same location, so that I don't have to re-aim the map.
19. As a creator, I want to leave create mode via an X or `Escape`, so that I'm never trapped after
    entering it by accident.
20. As a creator in create mode, I want clicking an existing patio to drop me into view mode with
    that patio selected, so that inspecting a neighbor doesn't fight with placing.
21. As a disconnected visitor, I want the page to stay in view mode, so that I'm not offered a
    create flow I cannot complete.
22. As a disconnected visitor, I want `+ Create Patio` to prompt me to connect and then continue
    into create mode, so that connecting is one step, not two.
23. As a creator on the wrong network, I want the footer to offer `Switch Network` before any mint
    is attempted, so that I don't waste a failed transaction.

## Implementation Decisions

### Mode ownership

- `CreatePatioContext` remains the single owner of `mode` and `selectedPatioId`. **No URL search
  params** — create mode is meaningless to restore without the camera, the mint snapshot cannot
  round-trip, and `/patios/$id` already provides shareable per-patio links.
- The module keeps the name `CreatePatio` and the route keeps `/create-patio`. Renaming would churn
  the route tree, `useCreatePatioRouteApi`, and the Home entry point for zero behavior change.
- Only one bottom-right popup exists at a time. Entering create mode clears `selectedPatioId`;
  selecting a patio clears create state.

### Header

- `ModeZoomButton` is **deleted outright**. Its zoom-sufficiency logic moves into the new-patio
  popup footer.
- `CreatePatioButton` renders in the header right slot **to the left of `GeocoderSearch`**,
  `variant="brand"` with a leading plus icon, mirroring `Home/components/LibraryToolbar`.
- It is **unconditionally enabled** and has **no zoom gate** — create mode can be entered at any
  zoom; the popup footer handles the too-far-out case.
- It renders **only when `mode === 'view'`**. In create mode the slot is empty (exit is via the
  popup X / `Escape`).

### View mode

- Grid path, center square, red intersection layer, and the low-zoom orange center badge
  (`CREATE_MARKER_KEY` in `ClusterMarkers`) are all gated on `mode === 'create'`. `useGridDriver`
  mounts only in create mode.
- `SquaresOverlay` stays a single component with a single `useSquaresDriver` — patio geometry is
  needed in both modes; only the create-only elements are conditionally rendered. The `center` entry
  keeps being written every frame (one rect) so there is no branch inside the render loop.
- Selection paths:
  - **Square hit-test** (`useSelectPatioOnClick`) → select + fly to the patio + open popup.
  - **Singleton badge tap** → select + fly to `SINGLE_PATIO_VIEW_ZOOM` + open popup.
  - **Cluster badge tap** → expand only; no selection, no popup.
  - **Miss** → clear selection, close popup.
- Selecting a patio **from create mode** sets mode to `view` and selects, but performs **no camera
  move** (the user was aiming at something; don't yank the view).

### Indicator palette

- `Patio` gains `ownerAddress?: string`. `PatioPointProperties` gains `isMine: boolean`, derived in
  a `useMemo` over `usePatioPoints()` + `useAccount().address`, so the source data recomputes when
  the wallet connects, disconnects, or switches account.
- Square + singleton-badge type mapping (`Indicator` component, 5 types × 3 states):

  | | published | not published |
  |---|---|---|
  | **not mine** | `Owned` — green | `Not published` — blue |
  | **mine** | `Owned and published` — orange | `Owned and not published` — yellow |

  Plus `Target` (dark orange) for the create-mode center cursor.
- **Singleton badges use the full 4-color palette**; they morph into squares across `MORPH_BAND`, so
  matching colors keeps the morph a pure shape change.
- **Clusters are two-color only**: blue when `hasUnpublished`, green otherwise. Ownership is not
  aggregated into `clusterProperties`.
- Hover/press are driven **imperatively**, matching the existing driver pattern: a map `mousemove`
  handler reuses `isPointInSquare` and writes `data-state` on the matching rect; `mousedown`/`mouseup`
  write `pressed`. No React state, no per-frame re-render.
- There is no `selected` variant in the design system, so **selected reuses the `pressed` visual**
  and is sticky. Precedence: `selected` > `pressed` > `hovered` > `default`.

### Popups

- A shared `MapPopup` shell (card frame, header, X, row list) backs both popups — the two Figma
  frames use identical row typography and the same 300px card.
- **`PatioDetailsPopup`** (view mode): thumbnail, name, `<continent> • <lat>, <lng>`, then rows
  Owner / Status / Blockchain Link / Navigation Link, a `View More` toggle revealing Azimuth and
  When created, and a `View Patio` button → `/patios/$id`.
  - `Patio` gains optional `blockchainLink?: string` and `navigationLink?: string`; **rows are
    omitted entirely when undefined** rather than rendering empty values. Both render as
    copy-to-clipboard chips with middle truncation.
  - Expansion is local `useState`, collapsed by default, label swaps `View More` / `View Less`.
- **`NewPatioPopup`** (create mode): title `New Patio` + X, location line, rows Owner / Size /
  Azimuth / Price / Status / ID Estimate, then the mint footer.
  - **Size** — derived: `PATIO_SIZE_M ** 2` → `10 000 m2`.
  - **Azimuth** — real and live: the center square is screen-upright (`azimuthDeg: 0`), so its
    geographic azimuth is `-getProjectedNorthDeg(map)`; subscribes to map `render`.
  - **Coordinates** — live map center.
  - **Owner** — `useAccount()` address, truncated; `Neos` fallback.
  - **Price / ID Estimate / Status** — hardcoded mocks in `constants.ts` with a `TODO` for the real
    contract; ID estimate is `patios.length + 1`.

### Zoom gate

- The footer gate is `zoomEnough = isZoomEnough(...) && zoom >= PLACEMENT_MIN_ZOOM`. The pure ratio
  gate is insufficient on its own: it can read "enough" while the camera is still below
  `CROSSFADE_BAND.min`, i.e. before the grid and center square are even drawn.
- Below the gate the footer reads `Zoom In` and flies to
  `max(zoomForFootprint(ZOOM_IN_TARGET_RATIO), PLACEMENT_MIN_ZOOM)` — one press always lands in a
  mintable state. The button never disables; it always does something.

### Mint flow

- The flow lives **entirely in the popup footer** — there is no modal and no route. The map stays in
  create mode with grid and center square drawn throughout.
- Phases: `Payment Requested` → `Waiting for Confirmation` → `Waiting for Oracle` → success banner
  `✓ Patio minted successfully as Token #N` with `View` (brand) + `Create Another Patio` (surface).
- On press, `{ lat, lng, azimuthDeg }` is **snapshotted**. From that moment the popup shows the
  snapshot (no longer live) and the orange center square **detaches from screen center and pins to
  the snapshotted geo coordinates**, so panning slides it off-center and shows exactly what is being
  minted. The grid anchors to the snapshot too. The map stays fully interactive.
- `Create Another Patio` clears the snapshot; everything re-attaches to screen center.
- **Errors** share one treatment: the banner slot turns red with a phase-specific message
  (`Transaction rejected`, `Transaction failed`, `Oracle timed out`, `Wallet disconnected`), and the
  footer offers `Try Again` (brand) + `Cancel` (surface). `Try Again` restarts from phase 1 with the
  **same snapshot**. `Cancel` returns to idle create mode. The oracle phase has a ~60s timeout.
- **X** stays enabled during `Payment Requested` (nothing submitted yet) and is **disabled** during
  `Waiting for Confirmation` / `Waiting for Oracle` — it cannot cancel a submitted transaction.
  Patio clicks are likewise ignored while a mint is in flight.
- Backing API is a **stub**, not real `writeContract`: `createPatio({ lat, lng, azimuthDeg })` sleeps
  and **pushes into the in-memory fixtures array**, so `getPatio(id)` and `getPatioPoints()` both see
  the new patio. On success: `setQueryData(patiosKeys.detail(id), patio)` +
  `invalidateQueries(patiosKeys.points())`, so `View` navigates instantly and the new patio appears
  on the map as a normal square. One `TODO` marks the `useWriteContract` +
  `useWaitForTransactionReceipt` seam.

### Wallet gating

- **Disconnected → view mode is forced.** If the wallet disconnects while in create mode with no
  mint in flight, mode is reset to `view` and create state cleared.
- `+ Create Patio` when disconnected **opens the RainbowKit connect modal instead of switching
  mode**, then enters create mode automatically on success. Dismissing the modal does nothing.
  There is therefore no `Connect Wallet` footer state.
- **Wrong network** is checked at press time (not continuously): the footer reads `Switch Network`
  and calls `switchChain`.

### Overlap

- Overlap **does not block minting**. The red intersection layer stays purely informational.
- `INTERSECTION.border` in `constants.ts` is `'##FF0404'` (double `#`, invalid CSS, stroke never
  renders) — fixed as part of this work.

## Testing Decisions

This repo has **no test runner configured** (per CLAUDE.md) and none is to be added. "Tests" here
means manual verification plus identifying pure seams that could be unit-tested later.

- Pure, isolatable seams worth covering (candidates, not to be wired up now):
  - The combined zoom gate — boundary behavior at `PLACEMENT_MIN_ZOOM` and at the ratio threshold,
    and that the `Zoom In` fly target always lands above both.
  - Indicator type resolution — `(isPublished, isMine)` → one of four types, and cluster resolution
    `hasUnpublished` → blue/green.
  - Indicator state precedence — `selected` > `pressed` > `hovered` > `default`.
  - Geographic azimuth of the screen-upright center square across map bearings, including wraparound.
  - The mint phase machine as a pure reducer — phase transitions, error entry from each phase,
    `Try Again` reusing the snapshot, `Cancel` clearing it.
- Manual verification checklist:
  - Fresh load with no wallet → view mode, no grid, no center cursor, no intersection.
  - `+ Create Patio` while disconnected → connect modal → create mode on success; dismiss → nothing.
  - Create mode shows grid + center cursor; X and `Escape` both return to view mode.
  - Clicking a patio in view mode flies + opens details; the same click in create mode selects with
    no camera move.
  - Details popup expands/collapses; missing link rows are absent, not empty; `View Patio` navigates.
  - Square and badge colors match the 2×2 across connect/disconnect and account switch; clusters go
    blue only when they contain something unpublished.
  - Hover and press paint on squares; the selected square stays marked after the camera settles.
  - Zoomed far out in create mode → `Zoom In`; one press lands in a state where `Create Patio` shows.
  - Full mint: all three phases render, panning during the wait slides the pinned square off-center
    while the popup values stay frozen, success banner names the token, `View` opens the new patio,
    `Create Another Patio` re-attaches the square to center.
  - Rejecting in the wallet shows the red banner; `Try Again` reuses the same location.

## Out of Scope

- **Mobile / responsive layout for this page** — desktop only for now.
- Real contract integration: ABI, address, chain selection, `useWriteContract`,
  `useWaitForTransactionReceipt`, real oracle polling, real pricing. The stub marks the seam.
- Real persistence — the created patio lives in the in-memory fixtures array and does not survive
  reload.
- Blocking mints on overlap.
- A dedicated `selected` variant in the design system (reusing `pressed` instead).
- Reworking the Cesium `PatioEditor` or the `/patios/$id` view itself.
- Adding a test runner or automated tests.

## Further Notes

- Figma naming is loose: the `Indicator` type `Owned` means "minted by someone (not you) and
  published", and the cluster variants named `Owned` / `Published` are simply the green and blue
  circles. The 2×2 table above is authoritative over the layer names.
- `selectedPatioId` already exists in `CreatePatioContext` and is written by both selection paths but
  read by nothing. This work is what finally consumes it.
- Design sources: selected popup `9898-4406` and expanded state `9046-733`; create mode `9509-6110`;
  mint phases `9885-20601`, `9885-20854`, `9885-21049`, `9885-21244`; `Indicator` `9081-1180`;
  clusters `9096-429`.
