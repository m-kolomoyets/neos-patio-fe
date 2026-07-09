## What to build

Wire the clustering source and the globe projection into the `CreatePatio` Mapbox map. This slice is
proven with Mapbox's own GL layers before custom DOM markers replace them in issue #03.

- Add a react-map-gl `<Source>` fed by `usePatioPoints()` with:
  - `cluster: true`, `clusterRadius` and `clusterMaxZoom` as **named constants** (`clusterMaxZoom ≈
    13`).
  - `clusterProperties: { hasUnpublished: [...] }` — an accumulate expression that is `true` when any
    member has `isPublished === false`.
- Add temporary GL layers (`circle` for clusters + unclustered, `symbol` for the count) purely to
  verify the source clusters correctly. These are throwaway — issue #03 replaces them with DOM
  markers. Mark them clearly as temporary.
- Enable globe: `projection="globe"`, `minZoom = 0`. Add atmosphere via `map.setFog(...)` (sky +
  subtle star haze) on load.
- Add all new zoom/cluster constants to the module `constants.ts` (`CLUSTER_MAX_ZOOM`,
  `CLUSTER_RADIUS`, `MORPH_BAND` endpoints, `GLOBE_MIN_ZOOM`, badge-size buckets) so later issues
  consume them.

## Acceptance criteria

- [ ] A clustering `<Source>` is fed by `usePatioPoints()`; `cluster`, `clusterRadius`,
      `clusterMaxZoom` come from named constants.
- [ ] `clusterProperties.hasUnpublished` is present and true for any cluster containing an
      unpublished patio (verifiable via `queryRenderedFeatures`/inspector or the temp layers).
- [ ] Zooming out below ~z5–6 shows the globe with atmosphere; `minZoom = 0` reaches the full planet.
- [ ] Temporary GL layers render clusters + counts and are commented as throwaway.
- [ ] Zoom/cluster/globe constants live in `constants.ts`.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-patio-points-data-foundation
