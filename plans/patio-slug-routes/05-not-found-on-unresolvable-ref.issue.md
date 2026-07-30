# 05 — Not-found on unresolvable ref

## What to build

Close the loop on refs that match nothing.

Before this feature, an unknown patio id hit a non-null assertion and crashed into the error boundary. With the resolver now returning `null`, an unresolvable ref becomes a typed outcome, and the app should render its existing not-found page — the same one already wired at the root route.

The check lives in the shared hook, after the suspense query resolves, so the view and the editor behave identically. This is the same hook that owns the canonical correction from slice 04; both rules stay in one place rather than being duplicated across two modules.

Placing this in the component rather than the loader is deliberate. A loader-level not-found would require a blocking loader, which would change the page-transition overlay's timing — the same reason the loader stays a non-blocking prefetch throughout this feature.

## Acceptance criteria

- [ ] `/patios/nonsense` renders the app's existing not-found page
- [ ] `/patios/nonsense/edit` renders the not-found page too, not an empty editor
- [ ] `/patios/mont_saint_michel` — a near-miss punctuation variant — also renders not-found
- [ ] No error boundary, blank screen, or console error on an unresolvable ref
- [ ] The not-found check lives in the shared hook alongside the canonical correction, not duplicated per module
- [ ] The route loader is still a non-blocking prefetch
- [ ] Navigating from a not-found ref to a valid patio recovers cleanly with no stale overlay
- [ ] `pnpm test`, `pnpm lint`, and `pnpm tsc` pass

## Blocked by

- Blocked by `03-slug-routes-end-to-end.issue.md`
