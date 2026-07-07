## What to build

Expose patios as a lightweight point set that a Mapbox clustering source can consume, decoupled from
the paginated library list.

- Add `isPublished: boolean` to the `Patio` type (place it next to `isFeatured`), and seed it across
  the patio fixtures — a realistic mix of published and unpublished so clustering has both.
- Add `getPatioPoints()` to `services/patios` following repo conventions:
  - `api.ts`: a call that resolves the full patio set (reuse the existing fixture/mock source; no new
    endpoint shape beyond what the mock provides).
  - `queryKeys.ts`: a new hierarchical key (e.g. `PATIOS_QUERY_KEYS.points()`), independent of the
    `list*` keys.
  - `queries.ts`: `getPatioPointsQueryOptions()` + a thin `usePatioPoints()` hook, long `staleTime`
    (points change rarely).
- Return a minimal GeoJSON `FeatureCollection<Point>`: each feature is
  `{ geometry: Point([lng, lat]), properties: { id, isPublished, type } }`. No `objects`, previews,
  or other heavy fields.
- Put the `Patio[] → FeatureCollection` assembly in a pure util in `services/patios/utils/` (or the
  service folder), so it is isolatable.

## Acceptance criteria

- [ ] `Patio` has `isPublished: boolean`; every fixture sets it; both `true` and `false` appear.
- [ ] `getPatioPointsQueryOptions()` / `usePatioPoints()` exist with their own query key, not derived
      from `listPatios` params.
- [ ] The query resolves a `FeatureCollection<Point>` with `{ id, isPublished, type }` properties and
      no heavy fields.
- [ ] The `Patio[] → FeatureCollection` mapping is a pure, exported function.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Nothing.
