## What to build

Generalize the rotate-only HUD into a mode-agnostic readout, end to end, with no
behavior change for the user. Rename the `RotationReadout` React component to a
generic `DragReadout` that takes a pre-formatted label string + a world origin,
projects the origin to window coordinates, and renders the existing badge
(unchanged styling). Rename the gizmo callbacks `onRotate{Start,Update,End}` to
`onReadout{Start,Update,End}` and have `useTransformGizmo` format the rotate value
(signed cumulative degrees) into the string passed to `DragReadout`. Scale and
translate pass nothing yet. After this slice, rotate's degree badge looks and
behaves exactly as before — it just flows through the generic path.

## Acceptance criteria

- [ ] `RotationReadout` component renamed to `DragReadout`; takes `{ label: string; origin } | null` and renders the same badge (same CSS).
- [ ] Hook state holds `{ label, origin } | null` instead of degree-specific shape.
- [ ] Gizmo callbacks renamed to `onReadout{Start,Update,End}`; rotate fires them, degree formatting done in the hook.
- [ ] Translate and scale do not fire readout callbacks (no badge) — unchanged from today.
- [ ] Rotate drag still shows the live `+20°` / `-45°` / `0°` badge, identical to before.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
