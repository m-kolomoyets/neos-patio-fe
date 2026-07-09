## What to build

Split the patio experience into two routes and stand up a bare View page skeleton end-to-end:

- Move the existing **Patio Editor** from `/patios/$id` to `/patios/$id/edit` (component + loader unchanged).
- Add the new **Patio View** index route `/patios/$id/` rendering a `PatioView` module: create-patio-style framed surface + `AppBackground`, and a minimal header (left = back button → home, center = patio name as `h1`, right = empty; no location search, no mode/create button). No 3D map yet — map region can be an empty placeholder.
- The View module reads the patio via a suspense query (patio-detail query) and shows its name.
- Re-point the editor's route-api wrapper from `/patios/$id` to `/patios/$id/edit`.

Existing nav helpers already target `to: '/patios/$id'`, which now resolves to the View index — confirm they land on View with no call-site edits.

## Acceptance criteria

- [ ] `/patios/<id>/edit` renders the editor exactly as before (objects, sidebar, toolbar, viewcube, loader).
- [ ] `/patios/<id>/` renders the View page: framed surface, app background, header with back button + centered patio name.
- [ ] View header has no location search and no mode/create button; no subtitle line.
- [ ] Back button on View navigates to home `/`.
- [ ] Clicking a patio from home markers / action bar lands on `/patios/<id>/` (View).
- [ ] View route loader prefetches only the patio-detail query (not models).
- [ ] `npm run tsc` and `npm run lint` pass; route tree regenerates cleanly.

## Blocked by

None - can start immediately.
</content>
