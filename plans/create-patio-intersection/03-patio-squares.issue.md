## What to build

Existing patios rendered as blue, geo-anchored squares. A deterministic seeded generator produces ~6–8 patios at pseudo-random offsets around the start coordinate, each with its own size (80–160m) and azimuth, shaped as a GeoJSON `FeatureCollection` (cluster-ready for future bubble rendering). The SVG overlay projects each patio's geographic corners to pixels on every map move and draws them as rotated rounded `<rect rx=24>` with the blue equivalent of the center styling (`#315be4` border + blue radial gradient). Because patios are geo-anchored, they stay fixed to the ground and slide under the center square as the user pans.

## Acceptance criteria

- [ ] Seeded generator returns a stable GeoJSON `FeatureCollection` (same seed → same features across reloads), ~6–8 features, varied size 80–160m and varied azimuth, clustered around the start coordinate.
- [ ] Patio squares projected geo→pixels each frame and drawn in the SVG overlay.
- [ ] Patio squares stay anchored to their geographic location while panning/zooming (do not follow the viewport).
- [ ] Blue Figma styling applied (border + radial gradient), rounded 24px corners.
- [ ] Generator is a pure helper in the module's `utils/`; data shape is a `FeatureCollection`.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #02-center-square
