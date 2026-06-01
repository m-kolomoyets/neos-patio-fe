# Patio Editor — XYZ Object Placement & 3-Axis Transform

## Problem Statement

In the 3D patio editor, placed objects are stored and positioned using geographic coordinates (`lng`/`lat`/`alt`). This is awkward for a local scene-editing experience:

- Editing positions means typing latitude/longitude deltas in tiny degree increments — meaningless to a designer arranging objects within a single patio.
- Every drag round-trips scene→geo→scene, introducing conversion overhead and potential precision drift.
- The translate gizmo only exposes 2 of 3 axes (east/south). Objects cannot be moved up or down (altitude), even though an `alt` field exists.
- Rotation is limited to a single yaw axis. Objects cannot be pitched or rolled.
- There is no readout of an object's real-world size, so a designer has no sense of scale while placing.

## Solution

Move object placement to a local Cartesian frame (meters) anchored at the patio's bounds center, and give the editor full 6-DOF-style control:

- Objects store `x`/`y`/`z` (meters: east/up/south) plus `rotX`/`rotY`/`rotZ` (radians) and a uniform `scale`.
- The translate gizmo moves on all 3 axes — including up/down.
- The rotate gizmo rotates on all 3 axes.
- The Properties panel shows intuitive grouped controls: Position (m), Rotation (°), read-only Model Dimensions (m), and Scale.
- Objects stay constrained to the patio footprint horizontally (x/z), but are free to move vertically (y).

The user gets a direct, meter-based editing experience with no perceptible coordinate conversion, matching how the underlying three.js scene already works.

## User Stories

1. As a patio designer, I want object positions expressed in meters relative to the patio center, so that the numbers I edit are intuitive and local.
2. As a patio designer, I want to drag an object east/west, so that I can position it horizontally.
3. As a patio designer, I want to drag an object north/south, so that I can position it along the other horizontal axis.
4. As a patio designer, I want to drag an object up and down, so that I can raise or sink it (e.g. floating objects, sunken features).
5. As a patio designer, I want to rotate an object around its vertical axis (yaw), so that I can orient it on the ground.
6. As a patio designer, I want to rotate an object around its horizontal axes (pitch and roll), so that I can tilt or lean it.
7. As a patio designer, I want to type exact X/Y/Z position values in meters, so that I can place objects precisely.
8. As a patio designer, I want to type exact rotation values in degrees for all three axes, so that I can set precise orientations.
9. As a patio designer, I want to see the object's real-world dimensions (width/height/depth in meters), so that I understand its size while editing.
10. As a patio designer, I want the dimensions to update live as I change scale, so that I can size an object to a target footprint by eye.
11. As a patio designer, I want a uniform scale control, so that the object grows/shrinks proportionally.
12. As a patio designer, I want newly added objects to appear at the center of my current view, so that they are immediately visible and not off-screen.
13. As a patio designer, I want objects to stay within the patio footprint horizontally, so that I cannot accidentally drag them outside the scene I'm editing.
14. As a patio designer, I want vertical movement to be unconstrained, so that the third axis is genuinely usable.
15. As a patio designer, I want dragging in the viewport and typing in the panel to stay in sync, so that both reflect the same object state.
16. As a patio designer, I want my edits to autosave, so that I don't lose work — unchanged from current behavior.
17. As a patio designer, I want undo/redo to work across all transform types, so that any change can be reverted — unchanged from current behavior.

## Implementation Decisions

### Coordinate frame
- Origin is the patio **bounds center** at altitude 0, which is already the static render origin of the three.js `Canvas` (it does not move when the user pans the map).
- Stored coordinates are **raw three.js scene coordinates** in meters: `x` = east, `y` = up, `z` = south. No sign flipping. `z` being south-positive is accepted as a labeling note, traded for zero conversion.
- Scene units are already meters (the existing projection divides by `meterInMercatorCoordinateUnits`), so stored values equal what the transform gizmo produces directly.

### Data model
- `PlacedObject` becomes `{ id, modelId, x, y, z, rotX, rotY, rotZ, scale }`.
- Removes `lng`, `lat`, `alt`, `yawRad`.
- Rotation stored as an Euler triple in radians, default three.js `XYZ` order. Quaternions and non-uniform scale were considered and rejected (gimbal lock is irrelevant for object placement; uniform scale is intentionally preserved).

### Migration
- **None.** All persistence is an in-memory mock; every patio fixture has `objects: []`; no other code reads object `lng`/`lat`. The type is swapped cleanly with no dual-read path and no converter.

### Object rendering module
- Object positions render directly from stored values: position from `[x, y, z]`, rotation from `[rotX, rotY, rotZ]`. The per-render `geoToScene` projection is removed.
- The transform gizmo shows all of X/Y/Z for translate, rotate, and scale modes. The previous per-mode axis-visibility table collapses to all-true and is removed.
- On drag end, the patch is read raw from the gizmo target's position and rotation (and uniform scale). The scene→geo back-conversion is removed.
- The uniform-scale enforcement during scale drags is retained.

### Editor state module
- `add`: project the current map center (still tracked as lng/lat from map move events) into scene x/z at add-time, set y = 0, then clamp x/z. Map center remains lng/lat — only object storage is Cartesian.
- `transform`: clamp x/z to the scene-space bounds; y is left unconstrained.
- Undo/redo, selection, mode, and autosave are unaffected beyond the changed object shape.

### Bounds clamp module
- Rewritten to operate in scene space. The patio bounds corners are projected to scene meters once (using the surviving `geoToScene` and the bounds center anchor) to derive min/max x and min/max z. Clamp applies to x and z only.

### Coordinate projection module
- `sceneToGeo` is deleted (no longer any scene→geo conversion).
- `geoToScene` is kept and used in exactly two places: deriving the scene-space clamp range from bounds, and projecting the map center at add-time.

### Properties panel module
- Four grouped sections:
  1. **Position** — X / Y / Z in meters, step 0.1, editable.
  2. **Rotation** — X / Y / Z in degrees, step 1, editable, converted to/from stored radians.
  3. **Model Dimensions** — X / Y / Z in meters, **read-only**.
  4. **Scale** — uniform, step 0.1, editable.
- Dimensions are derived, not stored: for the selected object the panel loads the model list and the model's GLTF (the same cached `useGLTF` instance the scene uses, so no extra fetch), computes the local-space bounding-box size once, and multiplies by `scale`. Local-space size makes the readout rotation-independent. The panel computes this outside the `Canvas`, which is valid because GLTF caching and `Box3` are renderer-agnostic.

## Testing Decisions

This repository has **no test runner configured** (per `CLAUDE.md`), and the convention is not to add one unless explicitly requested. Therefore no automated tests are introduced as part of this work.

That said, the change deliberately isolates the pure, side-effect-free logic so it *would* be unit-testable if a runner is later added. A good test here would assert only external behavior (inputs → outputs), not internal wiring:

- **Bounds clamp (scene space)** — given bounds-derived min/max x/z and an input point, returns the point clamped on x and z with y passed through untouched; verifies a point inside is unchanged, a point past each edge is pinned, and y is never modified.
- **`geoToScene`** — given an origin and a point, returns the expected meter offsets (east/up/south); a point at the origin maps to ~zero, a known eastward offset maps to a positive x of the expected magnitude.
- **Add placement** — projecting a map center to scene x/z yields a point within the clamp range and y = 0.

Verification for this change is otherwise manual in the running editor: drag on all three translate axes, rotate on all three axes, confirm panel ↔ gizmo sync, confirm horizontal clamping holds while vertical movement is free, and confirm dimensions track scale.

## Out of Scope

- Any backend/real persistence of objects (storage is still the in-memory mock).
- Non-uniform scaling (scale stays uniform).
- Editable dimensions / sizing an object by typing a target dimension (dimensions are read-only).
- Snapping, grid alignment, or collision between objects.
- Multi-object selection or group transforms.
- Changing map behavior, camera `maxBounds`, terrain, or buildings.
- Y-axis floor/ceiling constraints (vertical is intentionally free).
- Quaternion-based rotation storage.

## Further Notes

- The choice to store raw three.js coordinates (z south-positive) is intentional: the entire point of the change is eliminating conversions, so storage equals exactly what the gizmo emits and what the renderer consumes. A label note on the south axis is the only ergonomic cost.
- `mapCenter` deliberately stays in lng/lat because it originates from map move events; it is converted to scene coordinates only at the moment an object is added.
- Dimensions are treated as a derived readout, not persisted state, because they are a deterministic function of the model geometry and scale.
