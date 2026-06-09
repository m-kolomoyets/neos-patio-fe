## What to build

Make the PatioEditor PropertiesPanel **Move** tab show and edit an object's position as **X / Y / Z meters** (east / north / up) measured from the patio's bounds center, instead of the current Alt + read-only Lng/Lat fields.

End-to-end:

- Add pure conversion helpers to `utils/geoPlacement.ts`:
  - a bounds-center ENU frame builder (`origin = ((W+E)/2, (S+N)/2, height 0)`, `Transforms.eastNorthUpToFixedFrame` + its inverse),
  - `geoToLocal(frame, pose) → { x, y, z }` meters,
  - `localToGeo(frame, { x, y, z }) → { lng, lat, height }`.
- In `PropertiesPanel`: memoize the frame on `bounds`, derive the selected object's `{ x, y, z }` **once per render**, and render three editable axis-tagged fields.
- Editing an axis substitutes it into the live triple → `localToGeo` → dispatch `transformLive` with `{ lng, lat, height }`. Reducer `clampToBounds` keeps it inside the patio.
- Preserve the existing edit lifecycle: `beginEdit` on focus, `commitEdit` on blur, `source !== 'event'` guard ignoring programmatic resets.

## Acceptance criteria

- [ ] Move tab shows X, Y, Z in meters (no Lng/Lat/Alt fields remain).
- [ ] Object at bounds center reads `x ≈ 0`, `y ≈ 0`; `z ≈ height`.
- [ ] Object east of center → `x > 0`; north → `y > 0`; higher altitude → larger `z`.
- [ ] Typing each axis moves the object correctly; dragging the gizmo updates the X/Y/Z readout live.
- [ ] Typing a value that maps outside the patio rectangle snaps back to the edge.
- [ ] A run of keystrokes in one field commits as a single undo step.
- [ ] `geoToLocal` → `localToGeo` round-trips to the original lng/lat/height within float tolerance.
- [ ] Origin ENU frame built once (memo on `bounds`), not rebuilt per keystroke; `{x,y,z}` derived once per render.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
