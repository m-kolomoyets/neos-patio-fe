## What to build

Add the third state — `error` — to `XRConnectDialog`, plus the Try again retry path.

The discriminant becomes `loading | success | error`, derived from `isError` and `isFetching`. A new keyed motion child is added to the `AnimatePresence mode="wait"` swap. `layout` continues to animate popup height as content size changes.

Error body: cloud-off icon (`cloud-off_80.svg`, 80px, hardcoded white fill preserved), `Dialog.Title` "Couldn't generate code" (`display-sm`), `Dialog.Description` "Check your connection and try again" (`text-xl`, visible — not sr-only), Try again button (`variant="surface" size="md"`) bound to React Query `refetch`.

Try again returns the UI to `loading`, then `success` or `error` again. Dismiss controls (Escape, backdrop, no top-right X) remain available throughout. Initial focus in error state lands on Try again.

The mock service always succeeds in checked-in code; failure is exercised by temporarily throwing inside `src/services/xr/api.ts` during manual verification.

## Acceptance criteria

- [ ] State machine extended to `loading | success | error`, derived from `isFetching` / `isError`
- [ ] Error body renders cloud-off icon (80px), `Dialog.Title` "Couldn't generate code" (`display-sm`), visible `Dialog.Description` "Check your connection and try again" (`text-xl`), Try again button (`surface` `md`)
- [ ] Try again button calls `refetch` on the XR login code query
- [ ] AnimatePresence handles 3-way swap with no double `Dialog.Title` mounted at once
- [ ] Popup height continues to animate smoothly between all three states
- [ ] Escape and backdrop click dismiss from error state as well
- [ ] Initial focus in error state lands on the Try again button
- [ ] `npm run tsc` and `npm run lint` pass
- [ ] Manual smoke (with temporary `throw` in `api.ts`): error body renders; Try again triggers loading → error again; removing the throw restores success path

## Blocked by

- Blocked by `plans/xr-connect-dialog/02-xr-connect-dialog-success-and-loading.issue.md`
