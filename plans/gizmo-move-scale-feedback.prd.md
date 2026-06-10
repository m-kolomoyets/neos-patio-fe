# Transform Gizmo — Move/Scale Feedback Parity & Scale Restyle

## Problem Statement

The rotate gizmo now has rich live feedback (degree badge + swept sector), but
move and scale modes are bare. When a user drags a translate axis, there is no
readout of how far the object travelled and no growing visual cue — the arrow is
a fixed stub that stays put while the object slides away. Scale mode has no live
feedback either: the cubes sit still during a drag, there is no axis line to read
direction along, and the cubes use the same loud per-axis RGB as the other modes
even though scaling is uniform. The axis geometry across modes is also heavier
than the reference (thick cylinder shafts, fat ring tubes, oversized cubes).

## Solution

Bring move and scale to feedback parity with rotate, and restyle scale to read as
the distinct, uniform operation it is:

1. **Move mode.** While dragging an axis, the gizmo freezes at the grab-start
   point (the "zero point", marked with a dot), the other two axes hide, and the
   dragged arrow grows from the dot to the object's live position — back and
   forth — with a cone head tracking the object. A floating badge anchored to the
   zero point shows the absolute distance travelled (auto cm/m). Arrow shafts
   become thin 3px lines instead of solid cylinders.

2. **Scale mode.** Cubes shrink a little, gain thin 3px axis lines from the
   origin, and recolor to grey at rest (`hsla(0,0%,67%,1)`), turning yellow on
   hover and on the dragged axis. During a drag the dragged cube follows the
   cursor along its axis (its line stretching with it) while the other two hide.
   No badge in scale mode.

3. **Rotate mode.** Unchanged behaviour and colors; rings get a slightly thinner
   tube only.

All feedback appears only during an active drag, on the grabbed axis only, and is
torn down on release — consistent with the existing rotate sector + dragged-axis
highlight.

## User Stories

1. As an editor user, I want to see how far I have moved an object while dragging a translate axis, so that I can position it a precise distance from where it started.
2. As an editor user, I want the move distance shown in friendly units (cm under a metre, m above), so that small and large moves both read clearly.
3. As an editor user, I want the move readout to show absolute distance, so that I judge magnitude without parsing a sign.
4. As an editor user, I want the move arrow to grow from the point where I grabbed (the zero point) toward the object's current position, so that the drag has a visible extent.
5. As an editor user, I want a dot marking the zero point during a move drag, so that I can see exactly where the object started.
6. As an editor user, I want the move arrow to grow whether I drag forward or backward along the axis, so that both directions get the same visual feedback.
7. As an editor user, I want the move badge anchored to the zero point, so that the readout stays put while the object slides.
8. As an editor user, I want the two non-dragged axes to hide during a move drag, so that only the relevant arrow and dot are on screen.
9. As an editor user, I want the move badge and growing arrow to disappear on release, so that the gizmo returns to its clean resting state.
10. As an editor user, I want move arrows drawn as thin 3px lines with a cone head, so that the gizmo looks light and matches the reference.
11. As an editor user, I want the whole length of a move axis (line + head) to stay clickable even though it is thin, so that grabbing the axis is not fiddly.
12. As an editor user, I want the scale cubes a little smaller, so that they feel proportionate to the rest of the gizmo.
13. As an editor user, I want thin 3px axis lines from the origin to each scale cube, so that I can read the axis direction the cube sits on.
14. As an editor user, I want the scale gizmo grey at rest, so that it reads as the distinct, uniform operation it is (not the RGB of move/rotate).
15. As an editor user, I want a scale axis to turn yellow when I hover it, so that I can see which one a click would grab.
16. As an editor user, I want the dragged scale axis to turn yellow during a drag, so that the active axis is obvious.
17. As an editor user, I want the dragged scale cube to follow the cursor along its axis while I drag, so that the cube's position reflects the live scale.
18. As an editor user, I want the dragged scale cube's axis line to stretch with it, so that the growing/shrinking length reinforces the scale factor.
19. As an editor user, I want the two non-dragged scale axes to hide during a scale drag, so that only the active axis shows.
20. As an editor user, I want no badge in scale mode, so that the uniform-scale interaction stays uncluttered.
21. As an editor user, I want the rotate rings a touch thinner, so that all three modes share a consistently light weight.
22. As an editor user, I want rotate mode otherwise unchanged, so that the rotation feedback I already rely on keeps working exactly as before.
23. As an editor user dragging a move axis back to the start, I want the readout near zero, so that I can cancel a move cleanly.
24. As an editor user, I want the live move distance to reflect what is committed on release, so that what I see is what I get.
25. As a developer, I want one shared badge component and one shared callback path driving both the rotate and move readouts, so that there is no duplicated HUD code.
26. As a developer, I want the scale-cube-follow offset derived from the same ratio used to scale the model, so that the cube never jumps on grab and stays consistent with the committed scale.

## Implementation Decisions

### Color / scope split

- **Move and rotate keep their existing per-axis RGB colors.** The grey→yellow
  scheme is **scale mode only**.
- Scale base color is `hsla(0, 0%, 67%, 1)` for cubes and their axis lines; the
  hovered axis (at rest) and the dragged axis (during drag) turn yellow. Mirrors
  the existing hover/drag highlight logic, just with a grey→yellow palette
  instead of RGB→lightened.

### Shared readout refactor

- **`RotationReadout` → generic `DragReadout` component.** Renamed/generalized to
  take a pre-formatted label string + a world origin, project the origin to window
  coordinates, and render the badge. Badge styling unchanged (yellow border,
  dark pill). Rotate passes a degree string, move passes a metres string, scale
  passes `null` (no badge).
- **Gizmo callbacks `onRotate{Start,Update,End}` → `onReadout{Start,Update,End}`.**
  Mode-agnostic. Fired for rotate (signed cumulative degrees) and translate
  (absolute distance), not fired for scale. The hook formats the value per mode
  into the string handed to `DragReadout` and tracks the readout origin.
- The hook holds the active readout (`{ label, origin } | null`) in state and
  surfaces it to `ObjectsLayer`, same as today's rotation readout.

### Move mode

- **Drag freezes the gizmo at the grab-start origin** (the zero point). The live
  per-frame re-pin to the moving target origin is suspended for the duration of a
  translate drag; the frozen origin is captured on `LEFT_DOWN`.
- On grab, all three static arrows hide. A growing-arrow overlay is drawn:
  - A world-space 3px polyline from the frozen zero point to the object's live
    origin (recomputed each frame as the object moves).
  - A cone head at the growing tip, oriented along the drag axis.
  - A single dot at the zero point.
  - All in the dragged axis' existing color.
- **Move distance value** = absolute distance from the zero point to the live
  origin. A pure formatter renders it auto-scaled: centimetres under 1 m
  (e.g. `45 cm`), metres at/above 1 m with 2 decimals (e.g. `1.25 m`). Fired
  through `onReadoutUpdate`; `0` reported on grab.
- **Static (resting) arrow geometry**: shaft cylinder replaced by a 3px polyline;
  cone head retained. A transparent (alpha 0) pick cylinder runs the full shaft
  length so the thin line + head stay grabbable end to end.

### Scale mode

- **Cubes a little smaller** than current.
- **Thin 3px axis lines** added from origin to each cube.
- **Grey/yellow palette** (see Color split): grey at rest, hovered axis yellow,
  dragged axis yellow.
- **Drag**: the two non-dragged axes hide; the dragged cube follows the cursor
  along its axis with its line stretching to it. The cube's local offset is
  `baseOffset · ratio`, where `ratio` is the same current/start distance ratio
  already driving the uniform model scale — so the cube sits under the cursor with
  no grab-time jump and reflects the committed scale.
- **No badge** — `onReadout*` not fired in scale mode.

### Rotate mode

- Torus tube radius reduced (~`0.04` → ~`0.022`) for a lighter ring. No other
  changes; colors, sector, badge, and commit path untouched (via the generic
  callback rename only).

### Geometry / picking notes

- Thin 3px lines are screen-space polyline widths (same mechanism as the rotate
  sector strokes), independent of the per-frame gizmo scale.
- Move/scale axis-line picking relies on transparent proxy geometry (move: full
  pick cylinder; scale: existing cube + line) so thin visuals stay clickable.
- The growing move arrow is drawn in world space directly (zero → live origin) so
  its tip always touches the object regardless of zoom; the dot and cone stay
  screen-constant.

### Behavioural constraints

- All new feedback is drag-only and grabbed-axis only; everything is torn down on
  release and on gizmo `destroy()`. No extra history entries.
- Renders requested through the existing `requestRender` path so updates show
  under `requestRenderMode`.

## Testing Decisions

This repo has **no test runner configured** (per `CLAUDE.md`), and the standing
convention is not to add one unless asked. No automated tests ship with this
feature by default.

A good test exercises external behaviour only, not implementation detail. If/when
a runner is introduced, the prime isolation-testable candidates are the new pure
helpers:

- **Distance formatter** (metres value → display string): boundary at 1 m
  (`99 cm` vs `1.00 m`), rounding of centimetres, 2-decimal metres, zero case.
- **Scale-cube offset** (`baseOffset · ratio`): ratio of 1 yields the base offset
  (no jump on grab), ratios above/below 1 grow/shrink monotonically.

Prior art: the rotate readout's `radiansToDisplayDegrees` and `buildSectorGeometry`
are the structural analogues for pure helpers.

Cesium-bound pieces (drag instrumentation, frozen-origin overlay, primitive
lifecycle, HUD projection) are verified manually in the editor.

## Out of Scope

- Numeric/keyboard entry of an exact distance or scale, or snap-to-increment.
- A scale-mode badge or any scale numeric readout.
- Changing move or rotate colors (only scale is recolored).
- Converting rotate rings to polylines or restyling them beyond the thinner tube.
- Per-axis (non-uniform) scaling — scale stays uniform.
- Re-grounding / surface-snapping behaviour on move release (already separately
  disabled in the hook; untouched here).
- Internationalisation / units other than cm·m and degrees.
- Multi-object / batch transform feedback.

## Further Notes

- The growing move arrow and the stretching scale line are rebuilt as the drag
  updates; under `requestRenderMode` this is bounded to drag frames only.
- Move badge placement follows the existing rotate badge offset (lifted up/right
  of the origin, out from under the cursor); exact pixel offset is a styling
  detail to settle in implementation.
- Scale yellow should align with the existing axis-highlight yellow used by the
  rotate sector so the active-axis cue stays coherent across modes.
