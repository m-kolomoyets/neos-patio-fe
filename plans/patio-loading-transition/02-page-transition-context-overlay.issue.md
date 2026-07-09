## What to build

The core loading transition, demoable end-to-end on the Home-click path. A `PageTransition` context provider mounted at the root route (`__root`) above `<Outlet/>` is the single source of truth for the overlay. An overlay component, driven by context state, renders: full-bleed background (`previewBackgroundUrl`, `cover`), dark scrim, the `LoadingSpinnerWithLogo`, and a `Loading {name}` label beneath it — matching Figma node `6658-83482`. Fade powered by `motion` (follow `XRConnectDialog` / `UploadModelFlow` patterns).

A helper hook `usePatioTransitionNavigate` calls `start({ backgroundUrl, name })` then navigates; both Home cards (featured `<Link>` and library programmatic `navigate`) route through it. For this slice, `finish()` is triggered by a temporary signal (e.g. the patio query resolving) so the full fade-in → fade-out cycle is demoable before Cesium wiring exists.

Context API: state `active`, `backgroundUrl?`, `name?`; methods `start(payload?)`, `update(payload)`, `finish()`. Fade-in ~300ms ease-out (immediate, no delay), fade-out ~500ms ease-in-out, minimum display ~600ms to prevent flicker.

## Acceptance criteria

- [ ] Clicking the featured Home card fades in the overlay immediately with correct background + `Loading {name}`
- [ ] Clicking a library Home card does the same (shared helper hook, no duplicated trigger logic)
- [ ] Overlay shows full-bleed bg, dark scrim, centered branded spinner, and name label per Figma
- [ ] Fade-in ~300ms; fade-out ~500ms; overlay never flickers on fast resolves (~600ms min display)
- [ ] Context provider lives in `__root` and is the single source of truth
- [ ] `finish()` (temp trigger) fades the overlay out and resets state

## Blocked by

- Blocked by #01-loading-spinner-with-logo
