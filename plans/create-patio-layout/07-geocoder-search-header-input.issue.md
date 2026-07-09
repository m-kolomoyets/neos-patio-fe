## What to build

Add place search to the header so creators can jump the map to a real-world location. Create a
`geocoding` service following repo conventions: a ky call to the Mapbox Geocoding REST API (using the
existing `VITE_MAPBOX_TOKEN`), a hierarchical query-key factory, and `queryOptions`/hook wrappers —
no new npm dependency. Render an always-visible search input in the header, reusing the existing
`Autocomplete` primitives and the debounced search pattern from `useActionBarSearch`. Selecting a
result flies the map to the result center at street-level zoom (16). It does not change mode.

## Acceptance criteria

- [ ] A `geocoding` service exists (ky + Mapbox Geocoding REST, query-key factory, `queryOptions`)
      matching repo service conventions; no new dependency added.
- [ ] Typing in the header's always-visible input debounces and shows place suggestions via the
      shared `Autocomplete` UI.
- [ ] Selecting a result flies the map to its center at zoom 16.
- [ ] Selecting a result does not change the screen mode.
- [ ] Empty/error/loading states are handled like the existing patio autocomplete.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-route-surface-header-scaffold
