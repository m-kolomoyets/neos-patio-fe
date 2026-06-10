## What to build

A translucent swept-sector ("pie slice") drawn inside the active rotation ring,
fanning from the angle where the drag started to the current cursor angle, so the
swept arc is visible while turning. Add a pure `buildSectorGeometry` module that
builds a flat triangle-fan mesh in the local XY plane (ring normal along +Z) at
the ring radius spanning `[startAngle, endAngle]` — position-only, in the same
style and 16-bit-index invariant as `buildTorusGeometry`. The transform gizmo
creates a separate always-on-top, translucent (yellow) sector `Primitive` on
rotate-drag start, oriented in the same local ENU frame as the rings (existing
per-axis rotation, offset by the start angle), rebuilds it as the swept angle
changes during the drag, and removes it on release. Sector is shown on the
grabbed axis only, consistent with the existing dragged-axis highlight/hide.

## Acceptance criteria

- [ ] `buildSectorGeometry` returns a fan mesh spanning the requested start→end angle at the ring radius, with indices within 16-bit range.
- [ ] Dragging a rotation ring shows a translucent sector inside that ring, growing/shrinking with the turn.
- [ ] Sector starts from the grab (start-spoke) direction and tracks to the current cursor direction.
- [ ] Sector winds correctly for both positive and negative drags.
- [ ] Sector appears only on the grabbed axis; the other two rings stay hidden during the drag.
- [ ] Sector renders always-on-top (visible over the model) and is torn down on release and on gizmo `destroy()`.
- [ ] Renders update under `requestRenderMode` (via the existing render-request path).
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #live-angle-badge (shares the rotate-drag angle accumulation and start-spoke instrumentation).
