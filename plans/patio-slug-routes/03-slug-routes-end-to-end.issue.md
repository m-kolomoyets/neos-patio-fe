# 03 — Slug routes end-to-end

## What to build

The slice that makes pretty URLs real. After this, clicking any patio anywhere in the app lands on `/patios/mont-saint-michel`, and the editor lives at `/patios/mont-saint-michel/edit`.

The route param is renamed from `id` to `slug` on both the view index and the edit sub-route, which means renaming the route files and regenerating the route tree. The param name matters: leaving it `id` while it holds a slug would mislead every downstream reader.

The patios service gains a resolver taking a single ref string and returning the patio or `null`. In this slice it only needs to handle the canonical slug — the alternate forms arrive in slice 04 — but its signature and nullable return are final here. The existing non-null assertion on patio lookup is removed; a miss is now a typed outcome.

The detail query is keyed by the ref as it appears in the URL, mirroring a real `GET /patios/:slug` endpoint and requiring no pre-resolution step in the loader. The object-update mutation keeps keying by the patio's stable id and invalidating at the patios root.

The route loader stays a non-blocking prefetch. This is deliberate and load-bearing: a blocking loader would make navigation wait on the fetch before unmounting the previous route, shifting the page-transition overlay's start-to-reveal timing and forcing the transition context's seeding logic to be re-validated. Perceived navigation speed must be identical to before.

The three navigation entry points — action-bar autocomplete, featured patio card, and the shared patio-transition navigate hook — all already hold a full patio object, so each is a parameter swap. The transition hook's seed type gains `slug`.

Handling for unresolvable refs is slice 05; a `null` here may still fail loudly in the interim.

## Acceptance criteria

- [ ] Route param renamed to `slug` on both the view index and the edit sub-route; route files renamed and the route tree regenerated
- [ ] The resolver lives in the patios service, takes one ref string, and returns the patio or `null`
- [ ] The previous non-null assertion on patio lookup is gone
- [ ] The detail query is keyed by the ref from the URL
- [ ] The object-update mutation still keys by the patio's stable id and invalidates at the patios root
- [ ] The route loader remains a non-blocking prefetch
- [ ] `/patios/mont-saint-michel` renders the read-only view
- [ ] `/patios/mont-saint-michel/edit` renders the editor, behaviour otherwise unchanged
- [ ] Action-bar autocomplete navigates to the slug URL
- [ ] Featured patio card links to the slug URL
- [ ] The shared patio-transition navigate hook navigates to the slug URL; its seed type includes `slug`
- [ ] The page-transition overlay appears, covers the load, and reveals with timing indistinguishable from before the change
- [ ] The page-transition path matcher needs no modification — verified, not assumed
- [ ] Home library card, featured carousel, and action-bar search all land on a canonical slug URL from the first frame
- [ ] `pnpm test`, `pnpm lint`, and `pnpm tsc` pass

## Blocked by

- Blocked by `02-patio-slug-field-and-index.issue.md`
