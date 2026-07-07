# Create Patio — Globe View & Patio Clustering — PRD

## Problem Statement

The Create Patio map is a single-purpose, mid-zoom satellite view built for placing one patio. As a
creator zooms out there is no useful global picture: existing patios keep rendering as full
geo-accurate squares (via `SquaresOverlay`) that shrink into meaningless specks, there is no way to
see where patios exist across a city, a country, or the planet, and the map stays a flat Web Mercator
plane instead of reading as a world. Placing a patio and *discovering the wider landscape of patios*
are the same screen, but the screen only serves the first.

## Solution

Make the existing Create Patio Mapbox map a single continuous-zoom experience where zooming out turns
it into a browsable, clustered globe — without a second screen.

- Patios load once as a lightweight point set and feed a native Mapbox clustering source.
- As the camera zooms out, each patio marker performs a literal geometric tween from its
  geo-accurate placement **square** into a fixed-size **circle**; once settled, dense circles merge
  into **count bubbles** (clusters).
- Clusters render as the Figma design: circular green badges with a white count; a cluster that
  contains at least one **unpublished** patio turns **blue**. Badge size steps up with count.
- Zooming far enough out flips Mapbox into **globe** projection with atmosphere, so the creator sees
  the whole planet with patio clusters on it.
- Tapping a cluster flies the camera down to the zoom where it breaks apart; tapping a single patio
  selects it. Below the placement threshold the screen is browse-only; the existing header **Zoom
  in** button is the bridge back down to placement zoom.
- The patio being created stays an orange marker, always on top, never clustered, morphing square↔
  circle with the rest.

This is a **map-behavior** feature. It reuses the header, search, scale bar, and mode/zoom button
owned by the [Create Patio Layout Rework](./create-patio-layout.prd.md) plan and does not re-build
them.

## User Stories

1. As a creator, when I zoom out from placement, I want existing patio squares to smoothly become
   circles, so that the map stays legible instead of filling with tiny squares.
2. As a creator, when many patios sit close together, I want them merged into a single count bubble,
   so that dense areas stay readable.
3. As a creator, I want each count bubble to show how many patios it holds, so that I can gauge
   density at a glance.
4. As a creator, I want a cluster that contains an unpublished patio to read blue instead of green,
   so that I can spot where my unpublished work lives.
5. As a creator, I want to keep zooming out to a full globe with atmosphere, so that I can see patios
   across the whole planet.
6. As a creator, I want tapping a count bubble to fly the camera down until it breaks into smaller
   clusters or individual patios, so that I can drill into a region.
7. As a creator, I want tapping a single patio circle to select it, so that inspecting a patio works
   the same whether zoomed in or out.
8. As a creator, I want the patio I'm creating to stay a distinct orange marker on top of everything
   and never disappear into a cluster, so that I never lose my placement.
9. As a creator zoomed out for browsing, I want placement interactions paused, so that panning the
   globe doesn't accidentally move my footprint.
10. As a creator, I want the header "Zoom in" button to bring me from the globe back down to
    placement zoom, so that I can return to placing after browsing.
11. As a creator who prefers reduced motion, I want camera flights, the square↔circle morph, and
    atmosphere shimmer replaced with instant cuts, so that motion doesn't make me uncomfortable.
12. As a developer, I want patios exposed as a lightweight point set decoupled from the paginated
    library list, so that the map can cluster every patio without fetching full records.

## Implementation Decisions

### Surface

- Extend the **existing** `CreatePatio` Mapbox map (no new route or screen). One continuous-zoom map
  drives all three behaviors: placement, browse/cluster, and globe.

### Zoom bands (all configurable named constants)

- **z ≥ 17** — *placement*: geo-accurate square footprint, existing `SquaresOverlay` + collision,
  drag/reposition enabled.
- **z 14–17** — *morph band*: per-marker literal tween — `border-radius` 0% → 50% and size from the
  geo-accurate footprint (meters→px) down to the fixed circle size.
- **z ≤ 13** — *clustering*: `clusterMaxZoom ≈ 13`; settled circles merge into count bubbles. Merges
  animate via scale/fade (they are N→1, not a 1:1 tween).
- **z ≤ ~5–6** — Mapbox auto-transitions Mercator ↔ **globe**; `minZoom = 0`, atmosphere/fog on, no
  3D terrain.
- Morph band and `clusterMaxZoom` are deliberately non-overlapping so morphing and clustering never
  fight.

### Clustering engine

- Native Mapbox **`cluster: true`** GeoJSON source (supercluster) computes clusters, counts, and
  expansion zoom. `clusterRadius` and `clusterMaxZoom` are named constants.
- `clusterProperties` aggregates `hasUnpublished` (any member `isPublished === false`) so a cluster
  can be colored blue without walking its leaves.

### Marker rendering

- Markers render as **react-map-gl `<Marker>` DOM** (not GL `circle`/`symbol` layers) to match the
  Figma badges pixel-for-pixel. The source is used only for the clustering math.
- **Viewport-only**: the marker set is derived from features in the current viewport
  (`querySourceFeatures` / rendered features), refreshed on `moveend`. It is not the full patio set.
- During an active zoom **inside the morph band**, `border-radius`/size are driven by a lightweight
  `render`-event handler writing CSS/transform, **not** a per-frame React re-render.

### Marker visual (from Figma `9289:27106`)

- Fully circular badge, green gradient `linear-gradient(168deg, rgba(48,209,88,.6),
  rgba(36,138,61,.6))`, 4px inset ring `#00a63e`, subtle backdrop-blur background, white count text
  (Inter 14px / `text-sm`).
- **Size steps by count**: `< 10` → 42px, `≥ 10` → 48px. Buckets are named constants, extendable to
  a third tier.
- **Color by state**: green = default. **Blue** = cluster's `hasUnpublished` is true. Blue is also
  the hover/selected treatment for a marker.
- A **lone** patio (no cluster at current zoom) renders as the same green circle with **no count**;
  tap selects it.

### New patio being created

- Always seeded at map center on entry; **orange**, visually distinct from patio clusters.
- **Never clustered**, always rendered on top. Morphs square↔circle across the morph band like the
  others, but as its own overlay element.

### Data

- Add `isPublished: boolean` to the `Patio` type (mirrors `isFeatured`) and seed it in the patio
  fixtures.
- New lightweight `getPatioPoints()` in `services/patios` (`api.ts` + `queryKeys.ts` +
  `queries.ts`), returning a minimal GeoJSON `FeatureCollection` of `Point`s with properties
  `{ id, isPublished, type }`. Its own long-lived query key, decoupled from the paginated
  `listPatios`.

### Globe

- `projection: 'globe'`, `minZoom = 0`. Atmosphere via Mapbox `setFog` (sky + subtle star haze). No
  3D terrain — flat satellite wrapped on the sphere. Mercator↔globe morph is Mapbox's built-in
  behavior around z5–6.

### Interaction

- **Placement gated to z ≥ 17.** Below 17 the map is browse-only: pan, zoom, tap cluster → expand,
  tap patio → select. Footprint drag/reposition re-enables at z ≥ 17.
- **Cluster tap** → `getClusterExpansionZoom` + `flyTo` to that zoom, centered on the cluster.
- **Singleton tap** → select that patio (reuses existing selection).
- The header **Zoom in** button (owned by the layout plan) is the bridge from globe/browse back down
  to placement zoom at the current center.

### Accessibility

- Honor `prefers-reduced-motion`: `flyTo` easings become jump cuts, the square↔circle morph snaps
  instead of tweening, and atmosphere shimmer is disabled.

## Testing Decisions

This repo has **no test runner configured** (per CLAUDE.md) and none is to be added. "Tests" here
means manual verification plus identifying pure seams that *could* be unit-tested later.

- Pure, isolatable seams worth covering (candidates, not to be wired up now):
  - Count → badge-size bucket (`< 10` → 42, `≥ 10` → 48) and its boundary at exactly 10.
  - Zoom → morph progress mapping across the 14–17 band (clamped at both ends).
  - The `hasUnpublished` cluster aggregation (any unpublished → blue).
  - GeoJSON assembly from `Patio[]` → `FeatureCollection` (coords, id, isPublished, type).
- Manual verification checklist:
  - Zooming out morphs squares → circles → count bubbles → globe, with no double-rendering at the
    z17 handoff.
  - Bubble counts are correct; a bubble with any unpublished patio is blue, otherwise green; badge
    grows past count 10.
  - Tapping a bubble flies down until it breaks apart; tapping a lone patio selects it.
  - The orange create-patio marker never joins a cluster and stays on top at every zoom.
  - Below z17 the footprint cannot be moved; the header "Zoom in" button returns to placement zoom.
  - With `prefers-reduced-motion`, flights and morphs are instant and atmosphere shimmer is off.

## Out of Scope

- Filters (continent/type) on the Create Patio map — the create flow has no filters.
- Header, place-search, scale bar, and the mode/zoom button chrome — owned by the
  [Create Patio Layout Rework](./create-patio-layout.prd.md) plan.
- Server-side / tiled clustering — client-side native clustering only; the GeoJSON contract lets us
  swap later if patio counts explode.
- 3D terrain on the globe.
- Selected-patio detail/popup content (selection only, as in the layout plan).
- A real publish/unpublish workflow — `isPublished` is a data attribute seeded in fixtures; no UI to
  toggle it.
- Adding a test runner or automated tests.

## Further Notes

- Blue-vs-green is derived purely from `clusterProperties.hasUnpublished`; a single unpublished patio
  renders blue on its own circle for the same reason.
- The morph band (14–17) and `clusterMaxZoom` (13) are intentionally disjoint; if either constant is
  retuned, keep them non-overlapping or morphing and clustering will visibly conflict.
- Barcelona seed and deterministic `seededPatios` are retained; `getPatioPoints()` derives its
  FeatureCollection from the same source data plus the new `isPublished` field.
