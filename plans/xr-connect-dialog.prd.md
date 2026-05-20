# XR Connect Dialog

## Problem Statement

User on the Home page sees a VR headset icon button in the top action bar but clicking it does nothing. There is no way to start an XR pairing flow from the web app — a user who wants to bring their headset into the patio cannot retrieve the pairing code they need to enter on the device.

## Solution

Clicking the VR headset icon opens a modal dialog that requests a one-time 6-digit XR login code from the backend and displays it large and readable. While the code is being fetched the user sees a loading spinner in place of the code. If code generation fails the dialog swaps to an error state with a clear message and a Try again action. A Close action dismisses the dialog; reopening it generates a fresh code.

## User Stories

1. As a Home page visitor, I want a VR headset button in the action bar to be interactive, so that I can start the XR pairing flow.
2. As a user, I want a modal dialog to open over the page when I click the VR headset button, so that the pairing flow takes my focus.
3. As a user, I want the dialog to request a one-time pairing code from the server when it opens, so that I do not have to take an extra action to get one.
4. As a user, I want a clearly visible loading indicator while the code is being generated, so that I know the request is in flight.
5. As a user, I want the 6-digit code rendered in a large, generously tracked display style with a separator between the two halves, so that I can read it from across the room and type it on the headset without misreading characters.
6. As a user, I want a clear "XR Login" title above the code, so that I understand what the code is for.
7. As a user, I want a Close button to dismiss the dialog, so that I can leave the flow when I no longer need the code.
8. As a user, I want pressing Escape to close the dialog, so that I can dismiss it from the keyboard.
9. As a user, I want clicking the backdrop outside the popup to close the dialog, so that I can dismiss it without aiming at a button.
10. As a user, I want focus to be trapped inside the dialog while it is open, so that keyboard navigation does not leak to the page behind it.
11. As a user, I want a fresh code generated every time I reopen the dialog, so that I am not handed a stale or already-used code.
12. As a user, when code generation fails, I want the dialog to swap to an error state with an icon, a "Couldn't generate code" heading, and a "Check your connection and try again" subtitle, so that I understand what went wrong.
13. As a user in the error state, I want a Try again button that re-requests the code, so that I can recover without closing and reopening the dialog.
14. As a user, I want the transitions between loading, success, and error to be animated smoothly with the dialog height changing fluidly, so that the state change feels deliberate rather than jarring.
15. As a user on a screen reader, I want each dialog state to expose a meaningful accessible title and description, so that the dialog is understandable without sight.
16. As a developer extending the app, I want a generic `Dialog` primitive in `src/components/ui` that wraps Base UI's Dialog parts, so that future modals reuse the same surface styling and behavior.
17. As a developer, I want the XR-specific composition to live in `src/components/XRConnectDialog` and own its own open state, so that placing the trigger anywhere in the app only requires wrapping a button.
18. As a developer, I want the mock code endpoint to live under `src/services/xr` following the repo's service convention, so that swapping it for a real backend later is a localized change.
19. As a developer, I want the dialog to refresh the code on every open by setting query cache to zero, so that I do not have to manually invalidate keys.

## Implementation Decisions

### Modules

- **XR service layer** — new `src/services/xr/` with `api.ts`, `queryKeys.ts`, `queries.ts`, `types.ts`. Mocks an XR login code endpoint: a function that resolves after roughly 1200ms with a `{ code: string }` containing 6 random digits. Exposes a `getXRLoginCodeQueryOptions()` factory with `staleTime: 0` and `gcTime: 0` so each consumer mount fetches a fresh code. Query keys follow the hierarchical factory pattern used by `patios`.
- **Generic Dialog primitive** — new `src/components/ui/Dialog/` wrapping `@base-ui/react/dialog`. Compound API (Root, Trigger, Portal, Backdrop, Popup, Title, Description, Close) mirroring Base UI's surface and re-exporting Base UI prop types from `types.ts`. CSS Modules with design tokens; popup styled with the `surface-thicker` glass token, dimmed backdrop, rounded corners. Open/close animations driven by Base UI `data-state` CSS transitions (no Framer at the mount/unmount boundary).
- **XR Connect Dialog feature component** — new `src/components/XRConnectDialog/`. Self-contained, owns `open` state, renders its single child as a `Dialog.Trigger` so any button can be the entry point. Internally subscribes to the XR login code query with `enabled: open`. Derives a single discriminant `state ∈ { loading, success, error }` from `isFetching` / `isError`. Renders an `AnimatePresence mode="wait"` wrapper around three keyed motion children, with `layout` enabled on an inner container so popup height animates between states. Each state renders its own `Dialog.Title`. Success state renders a sr-only `Dialog.Description`; error state renders a visible one.
- **ActionsBar wiring** — modify `src/modules/Home/components/ActionsBar/index.tsx`. Replace the standalone VR icon `Button` with the same `Button` wrapped in `<XRConnectDialog>` as its sole child. No other ActionsBar logic changes.
- **Icons** — `src/icons/vr-headset_64.svg` and `src/icons/cloud-off_80.svg` already exist and are used as-is. The cloud-off icon keeps its hardcoded `fill="white"` and is not retrofitted to `currentColor`.

### Visual + interaction contract

- Popup: fixed width around 480px, content-hug height with a min-height that keeps loader and success states visually stable, large border-radius, `surface-thicker` background.
- Backdrop: dim overlay with optional backdrop-blur; closes the dialog on click.
- Success body: VR-headset icon (64px), "XR Login" title (`display-sm`), code rendered as `"NNN - NNN"` via simple string slice with CSS `letter-spacing` for tracking (`display-xl`, bold), Close pill button.
- Loading body: same shell as success; the code slot is replaced by `LoadingSpinner`. Title remains "XR Login".
- Error body: cloud-off icon (80px), "Couldn't generate code" title (`display-sm`), "Check your connection and try again" subtitle (`text-xl`), Try again pill button bound to `refetch`.
- Close and Try again buttons both use `Button variant="surface" size="md"`.
- Dismiss: Escape, backdrop click, and explicit buttons all close. No top-right X.
- Animation: Base UI handles popup mount/unmount fade+scale via CSS data-state. Inner content swap uses Framer `AnimatePresence mode="wait"` with one keyed motion child per state. The state container uses `layout` so popup height animates when switching states. Transitions are short (~200ms) ease-in-out.

### Accessibility

- The Base UI `Dialog.Title` rendered inside each state is the accessible name and is also visually displayed (no sr-only-only titles).
- Success state includes a sr-only `Dialog.Description` ("Use this 6-digit code to pair your headset" or similar) so screen-reader users get context the visual layout already implies.
- Error state's "Check your connection and try again" is rendered as `Dialog.Description` directly.
- Focus is trapped by Base UI Dialog default; first focus lands on the primary action (Close in success, Try again in error).

### Mock contract

- `generateXRLoginCode()` returns `Promise<{ code: string }>`. Resolves after ~1200ms with six random digits as a string. Always succeeds in production code — failure path can be exercised by temporarily throwing inside `api.ts`.

## Testing Decisions

This repository has no test runner configured (see `CLAUDE.md` — "There is no test runner configured in this repo."). No automated tests will be added as part of this work. Verification is manual:

- Verify the loader is visible for the full ~1200ms before the code appears.
- Verify the code re-randomizes on every open.
- Verify Escape, backdrop click, and Close all dismiss.
- Verify Try again re-runs the query and reverts the state to loading then success.
- Verify the popup height transitions smoothly between loader, success, and error.
- Verify screen reader announces the dialog title and (in error) the description.
- Verify keyboard focus is trapped while the dialog is open and returns to the trigger button on close.

If automated coverage is introduced later, the XR service layer (deterministic interface, easy to seed) and the `XRConnectDialog` state-derivation logic are the natural unit boundaries; the `ui/Dialog` primitive is a thin Base UI wrapper and is not worth unit testing on its own.

## Out of Scope

- A real backend endpoint for code generation. The mock stays until backend lands.
- Code expiry / countdown timer. The current design shows the code statically.
- Polling for headset-side confirmation that the code was entered.
- Wallet-gating, auth-gating, or any precondition checks on opening the dialog.
- Reusing the new `ui/Dialog` primitive in other places. Other modals can adopt it opportunistically later.
- Localization. Copy is hardcoded English to match the rest of the app today.
- Top-right close X. Design intentionally omits it.

## Further Notes

- The Base UI `Dialog.Title` rendered inside each state remounts on state swap. As long as exactly one `Dialog.Title` exists at a time, `aria-labelledby` resolves correctly.
- `gcTime: 0` plus `enabled: open` means the query unmounts and is garbage-collected when the dialog closes, which is what guarantees a fresh code on reopen.
- React Query will cancel the in-flight request when the consumer unmounts (e.g., the user dismisses mid-load), so no manual abort wiring is required.
- The 6-digit format is rendered with a literal `" - "` separator string. The current design's wide letter spacing is achieved via CSS `letter-spacing`, not per-digit spans.
- `staleTime: 0` is required in addition to `gcTime: 0` so that, in the rare case the cache entry is still present (e.g. another component mounted the query in the same tick), the dialog refetches rather than reading the cached value.
