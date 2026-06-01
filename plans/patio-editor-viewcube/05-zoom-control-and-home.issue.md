## What to build

The zoom stepper + popover and the Home view, completing the widget. Depends only on the camera plumbing (#1), so it can proceed in parallel with the cube chain (#2–#4).

**Zoom stepper** — `− [%] +`. 100% is anchored to the editor reference zoom (`DEFAULT_ZOOM` = 15); percentage = `2^(zoom − refZoom) · 100`. `+`/`−` step zoom by ±1 level. The readout shows the derived percentage.

**Zoom popover** — opened from the stepper, using the project's Base UI popover/menu primitive plus the existing `PopupWrapper` (panel) and `OptionItem` (rows). Items: Zoom in, Zoom out, Zoom to fit (`fitBounds(patioBounds)` from editor-state bounds), Zoom to 50% / 100% / 200% (`zoom = refZoom + log2(pct/100)`), Set current view as Home, Reset Home.

**Home** — a camera snapshot `{ center, zoom, bearing, pitch }`, default = the editor `initialViewState`. Persisted in `localStorage` keyed by patio id. Home button → `easeTo(home)`. "Set current view as Home" → write current camera. "Reset Home" → clear localStorage + ease to default. Survives reload.

All programmatic moves use `easeTo({ duration: 400 })`.

## Acceptance criteria

- [ ] Zoom stepper shows a percentage anchored at 100% = `DEFAULT_ZOOM`; `+`/`−` step ±1 zoom level and update the readout.
- [ ] Popover opens from the stepper using the Base UI primitive + `PopupWrapper` + `OptionItem`.
- [ ] Popover items work: Zoom in/out, Zoom to fit (`fitBounds` on patio bounds), Zoom to 50/100/200%.
- [ ] Home button eases to the saved home view (defaults to editor `initialViewState`).
- [ ] "Set current view as Home" persists the current camera to `localStorage` keyed by patio id; "Reset Home" clears it and eases to default.
- [ ] Home view survives a page reload.
- [ ] Zoom↔percentage conversion is a pure helper (15→100%, 16→200%, 14→50%; would be unit-testable).
- [ ] All programmatic camera moves use `easeTo({ duration: 400 })`.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-camera-plumbing-and-replace-navigation-control
