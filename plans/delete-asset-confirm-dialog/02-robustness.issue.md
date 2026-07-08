## What to build

Harden the delete confirmation dialog with its dismissal rules, in-flight state, and error handling.

Wire the dialog's close (X) button and Esc to cancel (leave the asset intact), and ensure outside/backdrop click does NOT dismiss (Base UI `AlertDialog` protective default for destructive actions). While the delete mutation is in flight, disable both footer buttons and the close X, and show a loading state on the **Yes, I'm sure** button (`isPending`). On failure, show an error toast, keep the dialog open, and re-enable the buttons so the user can retry.

## Acceptance criteria

- [ ] Close (X) button cancels and closes the dialog without deleting.
- [ ] Esc cancels and closes the dialog without deleting.
- [ ] Clicking outside / on the backdrop does NOT dismiss the dialog.
- [ ] While deleting, both buttons and the close X are disabled.
- [ ] While deleting, **Yes, I'm sure** shows a loading state.
- [ ] Rapid double-click on confirm cannot double-fire the mutation.
- [ ] On mutation error, `toast.error(...)` fires, the dialog stays open, and buttons re-enable for retry.
- [ ] Success remains silent (no success toast).
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-delete-happy-path
