## What to build

Replace the temporary GL layers with react-map-gl `<Marker>` DOM markers matching the Figma design
(`9289:27106`). This is the visual heart of the feature.

- New `ClusterMarkers` component in the `CreatePatio` module `components/`:
  - Derive the marker set from **viewport features only** (`querySourceFeatures` / rendered features
    in current bounds), refreshed on `moveend`. Do not render the full patio set.
  - For each cluster feature, render a circular badge; for each unclustered point, render a lone
    circle.
- Badge visual per Figma:
  - Fully circular, green gradient `linear-gradient(168deg, rgba(48,209,88,.6), rgba(36,138,61,.6))`,
    4px inset ring `#00a63e`, subtle backdrop-blur background, white count text (Inter `text-sm`).
  - **Size by count**: `< 10` → 42px, `≥ 10` → 48px (named-constant buckets). Count → size is a
    pure, exported helper.
  - **Blue** variant when the cluster's `hasUnpublished` is true (reuse blue for hover/selected).
  - Lone patio: same green circle, **no count** shown.
- Styling via CSS Modules + design tokens + `clsx`/data-attributes per project convention; extract
  reusable badge styling.

## Acceptance criteria

- [ ] Clusters and singletons render as DOM `<Marker>`s; the temporary GL layers from #02 are
      removed.
- [ ] Only viewport features are rendered; the set refreshes on `moveend`.
- [ ] Badge matches Figma: circular, green gradient, inset ring, backdrop-blur, white count.
- [ ] Badge is 42px for count `< 10` and 48px for `≥ 10`, via a pure helper + named constants.
- [ ] A cluster with `hasUnpublished` renders blue; otherwise green; lone patio shows no count.
- [ ] Styling uses CSS Modules + tokens (no hardcoded magic colors outside the documented Figma
      values).
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #02-cluster-source-globe-projection
