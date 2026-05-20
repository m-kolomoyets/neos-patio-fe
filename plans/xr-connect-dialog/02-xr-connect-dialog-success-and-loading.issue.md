## What to build

The XR Connect dialog happy path, end-to-end. New `src/components/XRConnectDialog/` feature component, plus the ActionsBar wiring that opens it.

The component is self-contained: owns its `open` state, renders its single child as a `Dialog.Trigger` (Base UI `render` pattern), subscribes to `getXRLoginCodeQueryOptions()` with `enabled: open`. A discriminant `state` is derived from `isFetching` / `isError`. This slice implements two of the three states — `loading` and `success`. Switching uses `AnimatePresence mode="wait"` around keyed `motion.div` children, with `layout` on the inner container so popup height animates as content size changes (~200ms ease).

Success body: VR-headset icon (`vr-headset_64.svg`), `Dialog.Title` "XR Login" rendered as `display-sm` Typography, code rendered as `"NNN - NNN"` via string slice with CSS `letter-spacing` for tracking (`display-xl` bold), Close button (`variant="surface" size="md"`), sr-only `Dialog.Description`.

Loading body: same shell — VR icon + "XR Login" title + Close — but the code slot is replaced with `LoadingSpinner` from `ui/LoadingSpinner`.

ActionsBar (`src/modules/Home/components/ActionsBar/index.tsx`) wraps the existing VR icon Button in `<XRConnectDialog>` as its sole child. No other ActionsBar logic changes.

Dismiss works via Escape, backdrop click, and Close button. No top-right X. `gcTime: 0` + `enabled: open` guarantees a fresh code on every reopen.

## Acceptance criteria

- [ ] `src/components/XRConnectDialog/index.tsx` exists, takes a single React child, renders it as `Dialog.Trigger`
- [ ] Component owns local `open` state, query runs with `enabled: open`
- [ ] State machine derives `loading | success` from `isFetching` (error state added in slice #3)
- [ ] Success body: VR icon (64px), `Dialog.Title` "XR Login" (`display-sm`), formatted code `NNN - NNN` (`display-xl` bold, CSS `letter-spacing`), Close button (`surface` `md`), sr-only `Dialog.Description`
- [ ] Loading body: same shell, code slot is `LoadingSpinner`
- [ ] `AnimatePresence mode="wait"` swaps loading↔success motion children; container `layout` animates height
- [ ] Each state renders its own `Dialog.Title` — never more than one mounted simultaneously
- [ ] Escape, backdrop click, and Close button all dismiss
- [ ] Reopening generates a fresh code (verified by clicking trigger twice → different digits)
- [ ] ActionsBar VR button is wrapped in `<XRConnectDialog>`; no other ActionsBar logic touched
- [ ] Keyboard focus is trapped in dialog; returns to trigger on close
- [ ] `npm run tsc` and `npm run lint` pass
- [ ] Manual smoke: spinner visible for ~1200ms then code appears; transitions feel smooth

## Blocked by

- Blocked by `plans/xr-connect-dialog/01-dialog-primitive-and-xr-service.issue.md`
