## What to build

Make the PatioEditor PropertiesPanel **Rotate** tab show and edit rotation as **X / Y / Z degrees** instead of H / P / R.

The stored heading/pitch/roll is already a Cesium ENU Euler decomposition, so this is a **lossless relabel** — no matrix/quaternion conversion:

- `X = roll`, `Y = pitch`, `Z = heading`, displayed `× 180/π`.
- Editing an axis writes the single corresponding stored radian value back (`× π/180`) via the existing independent `toPatch` shape.
- Sign convention pinned so displayed signs read intuitively and round-trip exactly.

Scale tab stays unchanged.

## Acceptance criteria

- [ ] Rotate tab shows X, Y, Z in degrees (no H/P/R labels remain).
- [ ] Each rotation axis is editable independently and updates the model orientation.
- [ ] Displayed degrees match the gizmo's rotation; editing then reading round-trips (radians → degrees → radians identity).
- [ ] Sign convention is consistent between display and edit.
- [ ] Edit lifecycle preserved (beginEdit/commitEdit, single undo step per field edit, programmatic-reset guard).
- [ ] Scale tab behavior unchanged.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
