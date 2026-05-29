## What to build

Extend the `Patio` type with `bounds` (bbox) and `objects: PlacedObject[]` (initially empty in mocks). Add a `PlacedObject` type. Add a `loader` to the non-lazy `/patios/$id` route that prefetches the patio detail via the existing `getPatioQueryOptions` factory. Replace the "coming soon" stub in the lazy route with a new `PatioEditor` module shell that fetches the patio detail and renders its name + a placeholder editor area. No map, no 3D yet — this slice only proves the route, data, and module wiring.

## Acceptance criteria

- [ ] `Patio` type includes `bounds: [west, south, east, north]` and `objects: PlacedObject[]`
- [ ] `PlacedObject` type exists with `{ id, modelId, lng, lat, alt, yawRad, scale }`
- [ ] Mock patios in `src/services/patios/api.ts` include realistic bounds and empty `objects` arrays
- [ ] Non-lazy `/patios/$id` route prefetches detail in a `loader`
- [ ] Lazy `/patios/$id` route renders `<PatioEditor />`
- [ ] `PatioEditor` module exists under `src/modules/PatioEditor/` and reads the patio via `usePatioEditorRouteApi` + `useQuery(getPatioQueryOptions(id))`
- [ ] Module renders the patio name and a visible placeholder for the editor surface
- [ ] `npm run tsc` and `npm run lint` clean

## Blocked by

None - can start immediately.
