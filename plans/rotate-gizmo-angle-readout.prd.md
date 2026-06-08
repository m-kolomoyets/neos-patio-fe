# Rotate Gizmo — Live Angle Readout & Swept Sector

## Problem Statement

When a user rotates a placed object with the gizmo, there is no feedback on how
far they have turned it. They cannot see the current angle, and there is no
visual indication of the arc swept so far. Precise or repeatable rotations
(e.g. "turn this exactly 20°") are guesswork — the user has to eyeball the
ring and accept whatever orientation lands.

## Solution

While dragging a rotation ring, the user sees two new pieces of feedback:

1. A floating badge near the gizmo showing the live rotation amount in degrees
   (e.g. `+20°` / `-45°`), updating continuously as they drag and disappearing
   on release.
2. A translucent "pie slice" sector drawn inside the active ring, fanning out
   from the angle where the drag started to the current cursor angle, growing
   and shrinking as they turn — so the swept arc is visible at a glance.

Both appear only during an active rotate drag, on the grabbed axis only, and
match the reference behaviour (badge with degree value + highlighted sector
between start spoke and current spoke).

## User Stories

1. As an editor user, I want to see the rotation amount in degrees while I drag the ring, so that I can turn an object to a precise angle.
2. As an editor user, I want the angle readout to update live as I drag, so that I get continuous feedback instead of only a final value.
3. As an editor user, I want the readout to show direction (+ for one way, − for the other), so that I know which way I am turning.
4. As an editor user, I want a visual sector/arc drawn inside the ring showing how far I have swept, so that I can judge the turn without reading numbers.
5. As an editor user, I want the sector to start from where I grabbed the ring, so that the swept region matches my drag, not an arbitrary zero.
6. As an editor user, I want the sector and badge to appear only on the axis I am dragging, so that the other two rings stay out of the way (consistent with the existing dragged-axis highlight).
7. As an editor user, I want the badge and sector to disappear when I release, so that the gizmo returns to its clean resting state.
8. As an editor user, I want the readout to track past 360° or wrap sensibly, so that multi-turn or back-and-forth drags read correctly.
9. As an editor user, I want the badge positioned near the gizmo on screen, so that I do not have to look away from the object I am rotating.
10. As an editor user, I want the badge to stay legible over any map background, so that I can always read the value.
11. As an editor user dragging then nudging back to zero, I want the readout to show ~0°, so that I can cancel a rotation cleanly without committing a turn.
12. As an editor user, I want the live readout to reflect the same value that gets committed to the object on release, so that what I see is what I get.
13. As a developer, I want the sector geometry built by a small pure module, so that it can be reasoned about and tested in isolation.
14. As a developer, I want the rotate drag to expose angle updates via callbacks, so that the React layer can render the badge without reaching into Cesium internals.

## Implementation Decisions

### Modules built / modified

- **`buildSectorGeometry` (new, pure geometry module).** Mirrors the existing
  `buildTorusGeometry` style: builds a flat triangle-fan ("pie slice") mesh in
  the local XY plane (ring normal along +Z), spanning `[startAngle, endAngle]`
  at the ring radius, position-only, for the flat per-instance color appearance.
  Pure function of its options — no Cesium scene state. This is the deep,
  isolation-testable module.

- **Rotate-drag instrumentation (`transformGizmo`).** The `RotateDrag` state
  gains an accumulated total angle (sum of per-move signed deltas) and the
  start-spoke direction. Each `MOUSE_MOVE` adds the delta and reports the new
  total. On `LEFT_DOWN` for a rotate handle the sector primitive is created; on
  `LEFT_UP` it is removed and the readout cleared.

- **Sector primitive lifecycle (`transformGizmo` + handles helper).** A separate
  always-on-top, translucent `Primitive` (yellow, matching reference) built from
  `buildSectorGeometry`, oriented in the same local ENU frame as the rings via
  the existing per-axis rotation, offset by the start angle. Rebuilt as the swept
  angle changes during the drag.

- **Gizmo callback surface (`transformGizmo` options / `TransformGizmoHandle`).**
  New optional callbacks: `onRotateStart`, `onRotateUpdate(degrees)`,
  `onRotateEnd` (or equivalent), fired only in rotate mode. Translate/scale
  behaviour unchanged.

- **`useTransformGizmo` hook.** Wires the new callbacks, holds the live rotation
  degrees and the active gizmo origin in state, and surfaces them so the layer
  can render the HUD. Existing commit-on-release logic (`commitRotate`) unchanged.

- **`RotationReadout` HUD (new React component under `ObjectsLayer`).**
  `ObjectsLayer` currently renders no DOM; it gains a small overlay. The readout
  projects the gizmo origin to window coordinates via
  `SceneTransforms.worldToWindowCoordinates`, positions an absolutely-placed
  badge near it, and shows the signed degree value. Hidden when no rotate drag is
  active. Styled with a co-located CSS module per repo convention.

### Angle / direction conventions

- Live value is the signed cumulative angle about the grabbed world axis, derived
  from the same `signedAngleAboutAxis` deltas already used to rotate the model.
- Displayed in whole degrees with sign and `°` suffix; a normalize/round helper
  converts radians → display degrees.
- Sector spans from the start-spoke direction to the current direction in the
  ring plane, so it visually equals the displayed magnitude.

### Behavioural constraints

- All new feedback is rotate-mode only and grabbed-axis only, consistent with the
  existing `setDraggedAxis` highlight/hide.
- Everything is torn down on release and on gizmo `destroy()`; nothing persists
  into the resting gizmo or commits extra history.
- Renders are requested through the existing `requestRender` path so updates show
  under `requestRenderMode`.

## Testing Decisions

This repo has **no test runner configured** (per `CLAUDE.md`), and the standing
convention is not to add one unless asked. So no automated tests ship with this
feature by default.

A good test here would exercise only external behaviour, not implementation
detail. If/when a runner is introduced, the prime candidate is the pure
**`buildSectorGeometry`** module — it has a simple input→mesh contract and no
scene dependency:

- A zero-span sector produces a degenerate/empty (or minimal) mesh.
- A positive vs negative span winds the fan in the correct direction.
- Vertex count scales with the requested segment count; indices stay within
  16-bit range (same invariant `buildTorusGeometry` relies on).
- Boundary vertices sit on the ring radius at the start and end angles.
- Spans beyond 2π are handled (clamped or wrapped) deterministically.

Prior art: `buildTorusGeometry` is the structural analogue (pure geometry
builder), so any sector tests would follow its shape.

The angle→display-degrees helper (sign, rounding, normalization) is also a pure,
isolation-testable unit if tests are added.

Cesium-bound pieces (drag instrumentation, primitive lifecycle, HUD projection)
are verified manually in the editor, not unit-tested.

## Out of Scope

- Numeric/keyboard entry of an exact angle, or snap-to-increment (e.g. 15°
  steps) — readout/visual only.
- Showing the readout/sector for translate or scale drags.
- Persisting or displaying the resting object's absolute heading anywhere outside
  an active drag.
- Restyling the existing rings, arrows, or cubes beyond adding the sector.
- Internationalisation/units other than degrees.
- Multi-object / batch rotation feedback.

## Further Notes

- The sector primitive is rebuilt as the angle changes; under `requestRenderMode`
  this is bounded to drag frames only. If rebuild cost shows up, an alternative is
  a fixed full-disk mesh revealed by an updated `modelMatrix`/clip — left as an
  optimisation, not required for v1.
- Badge placement follows the reference (offset to the side of the gizmo near the
  cursor). Exact pixel offset and whether it tracks the cursor vs. the ring edge
  is a styling detail to settle during implementation.
- Color: reference uses yellow for the active sector and spokes; align with the
  existing axis-highlight palette so the dragged-axis cue stays coherent.
