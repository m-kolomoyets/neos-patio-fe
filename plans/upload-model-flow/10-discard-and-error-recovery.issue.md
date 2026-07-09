## What to build

Discard confirmation, teardown, and error recovery — the safety net across the whole flow.
Closing the dialog while dirty raises a Base UI `AlertDialog`; confirming cancellation tears
everything down. Failures route to recoverable states with toasts.

## Acceptance criteria

- [ ] Close attempt (X/Esc/outside) while dirty (file selected / upload started / uploaded) raises an `AlertDialog` confirm
- [ ] Pristine `selecting` step (nothing chosen) closes directly with no confirm
- [ ] Confirming discard: aborts in-flight upload, calls `deleteModel(id)` if an id was issued, removes the sidebar item, revokes object URLs, resets to `idle`
- [ ] Upload API failure → in-dialog error state with Retry (same file) + Discard + error toast
- [ ] Parse/load failure → back to `selecting` with inline error + error toast
- [ ] Thumbnail/delete failures → toast only, non-blocking (thumbnail falls back to default capture)
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #01-toast-primitive
- Blocked by #05-provider-uploading-sidebar-item
- Blocked by #09-name-and-save
