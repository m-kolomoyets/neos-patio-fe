## What to build

Make the Create Patio screen a reachable, framed page. Add a `/create-patio` lazy route (lazy-only,
no `validateSearch`/`loader`) pointing at the `CreatePatio` module, plus a `useCreatePatioRouteApi`
hook per repo convention. Wrap the module in the same rounded (squircle) surface Home uses — reuse
`useSquircleClipPath`, the `surface-regular` treatment, a hairline border, and `overflow:hidden` —
laid out as a flex column: a static in-flow header on top, the map filling the rest.

The header is a three-zone grid (so the title stays truly centered): a back button on the left that
navigates to `/`, a static centered "Create patio" title, and an empty right slot reserved for later
slices. The map changes from a fixed full-viewport element to filling the map region inside the
surface, and the existing center square / patio squares overlay keeps working unchanged.

## Acceptance criteria

- [ ] `/create-patio` renders the `CreatePatio` module (reachable by URL).
- [ ] Module content is wrapped in a Home-style squircle surface with border and clipped corners.
- [ ] Surface is a flex column: static header on top, map fills remaining space (no longer fixed to
      the full viewport).
- [ ] Header shows back button (left), centered "Create patio" title, empty right slot.
- [ ] Back button navigates to `/`.
- [ ] The map, center square, and existing patio squares still render correctly inside the surface.
- [ ] `useCreatePatioRouteApi` hook exists and is used by the module.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
