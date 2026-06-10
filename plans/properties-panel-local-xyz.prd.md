# PRD — PropertiesPanel local X/Y/Z + Euler rotation

## Problem Statement

The PatioEditor properties panel shows a placed object's position as raw geographic values — longitude, latitude, and ellipsoid altitude — and its rotation as heading/pitch/roll. Longitude/latitude in degrees (6 decimals) are unintuitive for positioning a model on a patio: a creator thinks in meters from the scene center ("move it 2 m east, 0.5 m up"), not in fractional degrees. The horizontal fields are also read-only, so fine nudging by typing is impossible. Rotation labeled H/P/R does not match the familiar per-axis X/Y/Z mental model.

## Solution

Return the panel to showing **X / Y / Z in meters** for position and **X / Y / Z in degrees** for rotation, all editable.

- Position is expressed as an east/north/up offset, in meters, from the patio's center. Typing any axis moves the object; the value is converted back to the stored geographic pose.
- Rotation is expressed as X/Y/Z degrees, mapped directly from the stored roll/pitch/heading (a lossless relabel), each axis editable independently.
- Scale is unchanged.

The underlying stored model stays geographic (lng/lat/height + heading/pitch/roll radians); the panel is purely a presentation/edit layer with a fast, allocation-light conversion in both directions.

## User Stories

1. As a patio creator, I want to see an object's position as X/Y/Z meters, so that I can reason about placement in familiar units instead of fractional degrees.
2. As a patio creator, I want X/Y/Z measured from the patio center, so that the numbers are small and meaningful relative to the scene.
3. As a patio creator, I want to type an X value, so that I can nudge an object east/west by an exact distance.
4. As a patio creator, I want to type a Y value, so that I can nudge an object north/south by an exact distance.
5. As a patio creator, I want to type a Z value, so that I can set an object's height above the center by an exact distance.
6. As a patio creator, I want a typed position that lands outside the patio bounds to snap back to the edge, so that I cannot place objects outside the patio (consistent with gizmo dragging today).
7. As a patio creator, I want rotation shown as X/Y/Z degrees, so that orientation matches the per-axis model I already use.
8. As a patio creator, I want to edit each rotation axis independently, so that I can set a precise heading or tilt.
9. As a patio creator, I want a run of keystrokes in one field to commit as a single undo step, so that undo reverts a whole edit, not one digit at a time (preserves current begin/commit-edit behavior).
10. As a patio creator, I want the panel values to update live while I drag the gizmo, so that the readout always reflects the object's true pose.
11. As a patio creator, I want gizmo/undo-driven value resets to not be mistaken for my typing, so that programmatic syncs don't push spurious history or fight my input (preserves current source-guard behavior).
12. As a patio creator, I want scale to keep working exactly as before, so that nothing I rely on regresses.
13. As a developer, I want the geographic↔local conversion isolated in pure functions, so that the math is reviewable and reusable independent of React.
14. As a developer, I want the origin frame computed once per patio, so that editing is cheap and does not rebuild matrices per keystroke.
15. As a developer, I want a single position derivation per render rather than one per field, so that there is no redundant matrix work.

## Implementation Decisions

### Conversion module (deep module, `utils/geoPlacement.ts`)

- **Origin**: patio **bounds center** — `lng = (west+east)/2`, `lat = (south+north)/2`, `height = 0` (WGS84 ellipsoid). Deterministic and synchronous; no surface sampling. Consequence: `z` ≈ absolute altitude above the ellipsoid.
- **Local frame**: an east-north-up frame at the origin, built with Cesium `Transforms.eastNorthUpToFixedFrame(originECEF)`, plus its inverse (`Matrix4.inverse`). Both are derived from `bounds` only and are stable for the lifetime of a patio.
- New pure functions:
  - A frame builder that takes `PatioBounds` and returns the origin ECEF + ENU-to-fixed matrix + inverse.
  - `geoToLocal(frame, pose)` → `{ x, y, z }` meters: transform the object's ECEF position by the inverse ENU matrix; result components are east/north/up.
  - `localToGeo(frame, { x, y, z })` → `{ lng, lat, height }`: transform the local point by the ENU-to-fixed matrix to ECEF, then `Cartographic.fromCartesian` → degrees.
- Existing `geoPoseToModelMatrix` / `modelMatrixToGeoPose` / `clampToBounds` / `sampleSurfaceHeight` are untouched.

### Rotation mapping (lossless relabel)

- Stored heading/pitch/roll is already a Cesium ENU Euler decomposition. Display maps **X = roll, Y = pitch, Z = heading**, each `× 180/π`. Editing an axis writes back the single corresponding stored radian value (`× π/180`). No matrix/quaternion conversion. Sign convention pinned in implementation so the displayed sign reads intuitively and round-trips exactly.

### PropertiesPanel wiring

- The origin frame is memoized on `bounds` (from editor state).
- The selected object's `{ x, y, z }` is derived **once per render** (not per field) via `geoToLocal`.
- Position fields are **axis-tagged** (`'x' | 'y' | 'z'`). On edit, the panel substitutes the edited axis into the live `{x,y,z}` triple, runs `localToGeo`, and dispatches a `transformLive` patch of `{ lng, lat, height }`. `clampToBounds` continues to clamp lng/lat in the reducer, so out-of-bounds typing snaps back.
- Rotation and scale fields keep the existing simple independent `toPatch` shape (one stored field each).
- The Move tab shows X/Y/Z (meters) instead of Alt/Lng/Lat; lng/lat read-only fields are removed. The Rotate tab shows X/Y/Z (degrees). Scale tab unchanged.
- Existing edit lifecycle preserved: `beginEdit` on focus, `commitEdit` on blur, `transformLive` per change; the `source !== 'event'` guard still ignores programmatic resets.

### Performance

- Conversions are O(1) per selected object, executed only on selection change and per keystroke — never per animation frame and never looped over all scene objects.
- The origin ENU matrix + inverse are built once (memo on `bounds`); per-edit cost is a couple of Cesium matrix/vector multiplies (microseconds).
- Deriving the triple once per render removes the current 3× redundant per-field conversion.
- Conclusion: no performance concern for live editing or gizmo-driven live updates.

## Testing Decisions

This repo has **no test runner configured** (per CLAUDE.md), and adding one is out of scope. The conversion functions are nonetheless written as **pure, isolated functions** so they are testable if/when a runner is introduced. A good test here asserts **external behavior** (input pose → output meters/degrees, and round-trip identity) rather than internal matrix layout.

Intended coverage if tests are added:

- `geoToLocal` / `localToGeo` **round-trip**: a geographic pose → local → geographic returns the original lng/lat/height within floating-point tolerance.
- Origin behavior: an object exactly at bounds center yields `x ≈ 0, y ≈ 0`, and `z ≈ height`.
- Axis sense: an object east of center has `x > 0`; north has `y > 0`; higher altitude has larger `z`.
- Rotation relabel round-trip: radians → degrees → radians identity for X/Y/Z, including the pinned sign convention.
- Bounds interaction: typing a local X/Y that maps outside the rectangle is clamped to the edge (reducer-level `clampToBounds`).

Until a runner exists, validation is via `npm run tsc` + `npm run lint` and manual checks in the editor (select an object, read X/Y/Z, type each axis, drag the gizmo and confirm live readout).

## Out of Scope

- Adding a test runner or test files.
- Changing the stored data model (objects remain geographic lng/lat/height + heading/pitch/roll radians + scale).
- Surface-height sampling for the origin (origin height fixed at 0; `z` is altitude above the ellipsoid).
- True XYZ-order Euler recomputation from the rotation matrix (rejected in favor of lossless HPR relabel).
- Non-uniform scale (objects carry a single uniform scale).
- Gizmo behavior, ObjectsLayer rendering, autosave, and any other editor subsystem.

## Further Notes

- The choice of bounds-center origin (vs. the curated `Patio.coords`) avoids wiring new data into `EditorProvider`; the editor already holds `bounds`. If a more "official" center is wanted later, swapping the origin source is a one-line change confined to the frame builder.
- Because origin height is 0, `z` reads as ellipsoid altitude rather than height above local terrain — acceptable and deterministic; revisit only if creators expect "height above patio ground."
- The HPR-relabel approach means the gizmo, storage, and panel all stay in the same rotation representation, so there is no drift between what the gizmo does and what the panel shows.
