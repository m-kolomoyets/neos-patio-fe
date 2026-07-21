## What to build

Wire `Create Patio` to a three-phase mint flow that lives **entirely in the `NewPatioPopup`
footer** — no modal, no route. The map stays in create mode with the grid and center square drawn
throughout, and stays fully interactive.

### Snapshot

On press, snapshot `{ lat, lng, azimuthDeg }` into the flow state. From that moment:

- the popup shows the **snapshot**, not live map center;
- the orange center square **detaches from screen center and pins to the snapshotted geo
  coordinates**, so panning slides it off-center and shows exactly what is being minted;
- the grid anchors to the snapshot too.

`Create Another Patio` (or `Cancel`) clears the snapshot and everything re-attaches to screen center.

### Phases

`Payment Requested` → `Waiting for Confirmation` → `Waiting for Oracle` → success.

Each in-flight phase renders as a disabled footer button with a spinner and the phase label. Success
replaces it with a green banner `✓ Patio minted successfully as Token #N` plus `View` (brand) and
`Create Another Patio` (surface).

Model the phases as a **pure reducer** so the transitions are testable if a runner is ever added.

### Errors

One shared treatment: the banner slot turns red with a phase-specific message — `Transaction
rejected`, `Transaction failed`, `Oracle timed out`, `Wallet disconnected` — and the footer offers
`Try Again` (brand) + `Cancel` (surface).

- `Try Again` restarts from phase 1 with the **same snapshot** (never re-reads map center).
- `Cancel` clears the snapshot and returns to idle create mode.
- The oracle phase has a ~60s timeout.

### Locking

- The **X** stays enabled during `Payment Requested` (nothing submitted yet) and is **disabled**
  during `Waiting for Confirmation` and `Waiting for Oracle` — it cannot cancel a submitted
  transaction.
- Patio clicks are **ignored** while a mint is in flight (the create→view transition from #03 does
  not fire).
- Wallet disconnect mid-flow is an error, not a silent mode reset (this overrides the #01 rule while
  a mint is in flight).

### Network

Checked **at press time**, not continuously: if `useChainId()` does not match the configured chain,
the footer reads `Switch Network` and calls `switchChain` instead of starting a mint.

### API stub

No contract, ABI, or address exists. Build the full state machine against a stub:

- `createPatio({ lat, lng, azimuthDeg })` in `src/services/patios/api.ts` — sleeps, then **pushes
  into the in-memory fixtures array** and returns the full `Patio`, so `getPatio(id)` and
  `getPatioPoints()` both see it.
- `createPatioMutationOptions()` in `queries.ts`. On success:
  `queryClient.setQueryData(patiosKeys.detail(id), patio)` +
  `invalidateQueries(patiosKeys.points())`.
- One `// TODO: replace with useWriteContract + useWaitForTransactionReceipt` comment marking the
  seam. Do **not** wire real `writeContract` against a placeholder address.

After success, the minted patio is a normal square on the map — clicking it flips to view mode and
opens its details popup like any other.

## Acceptance criteria

- [ ] Pressing `Create Patio` snapshots location and azimuth; popup values stop tracking the map.
- [ ] The orange square pins to the snapshotted coordinates and slides off-center when panning;
      the grid follows it.
- [ ] All three phases render in order with spinner + label, footer disabled.
- [ ] Success shows the green banner naming the token, with `View` and `Create Another Patio`.
- [ ] `View` navigates to `/patios/$id` and the page renders without a fetch miss.
- [ ] `Create Another Patio` returns to idle create mode with the square re-attached to center.
- [ ] The minted patio appears on the map as a normal square and is selectable.
- [ ] Rejecting in the wallet shows the red banner; `Try Again` reuses the same snapshot; `Cancel`
      returns to idle.
- [ ] The oracle phase times out after ~60s into the error state.
- [ ] X is enabled during `Payment Requested`, disabled during the two waiting phases.
- [ ] Patio clicks do nothing while a mint is in flight.
- [ ] Wallet disconnect mid-flow shows the error banner rather than silently dropping to view mode.
- [ ] Wrong network shows `Switch Network` and switches on press; no mint is attempted first.
- [ ] The phase machine is a pure reducer, separate from the wagmi/mutation wiring.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #04-new-patio-popup-and-zoom-gate
