## What to build

Edge handling so the overlay never hangs or lingers. Two cases:

1. **Query error** — if the patio fetch errors, `finish()` is called immediately so the overlay clears and the route's error UI is shown (no waiting for the 5s timeout).
2. **Navigate away mid-transition** — when the route changes away from `/patios/$id` before the patio is ready, the provider resets state and clears any pending timeout, so the overlay does not linger on the next page.

## Acceptance criteria

- [ ] Patio fetch error clears the overlay immediately and reveals the route error UI
- [ ] Backing out / navigating away before ready resets the overlay cleanly; it does not appear on the next page
- [ ] Pending safety timeout is cleared on reset (no delayed `finish()` firing later)
- [ ] No console errors or state updates after the editor unmounts

## Blocked by

- Blocked by #02-page-transition-context-overlay
