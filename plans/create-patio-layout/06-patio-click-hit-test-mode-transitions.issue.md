## What to build

Make existing patio squares clickable and wire the create→view transition. Add point-in-rotated-rect
hit-testing against the on-screen patio squares (accounting for their bearing-adjusted screen
azimuth). Clicking a patio selects it. In create mode, clicking a patio also switches the screen back
to view mode. Selection is state only this pass — no info/detail popup content. The always-on center
square intersection/collision rendering is unchanged.

## Acceptance criteria

- [ ] Clicking within an existing patio square (rotated by the current bearing) registers a hit;
      clicking outside all squares does not.
- [ ] Clicking a patio selects it (selection state is tracked).
- [ ] In create mode, clicking a patio switches mode back to `view` and selects that patio.
- [ ] In view mode, clicking a patio selects it without changing mode.
- [ ] No info/detail popup is shown (selection only); center-square intersection still renders in
      both modes.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #04-mode-context-zoom-create-button
- Blocked by #05-bearing-rotation-square-azimuth
