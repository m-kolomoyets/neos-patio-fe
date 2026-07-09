## What to build

Add drag feedback to scale mode. On grab, hide the two non-dragged axes and turn
the dragged axis yellow. While dragging, the dragged cube follows the cursor along
its axis and its 3px line stretches to it: the cube's local offset is
`baseOffset · ratio`, where `ratio` is the same current/start distance ratio
already driving the uniform model scale — so the cube sits under the cursor with
no jump on grab and reflects the live scale. No badge in scale mode
(`onReadout*` not fired). Everything restores on release and on `destroy()`.

## Acceptance criteria

- [ ] On grab, non-dragged scale axes hide; dragged axis is yellow.
- [ ] Dragged cube follows the cursor along its axis; its line stretches with it.
- [ ] Cube offset = `baseOffset · ratio` (same ratio as the model scale) — no grab-time jump, monotonic with scale.
- [ ] No badge appears in scale mode.
- [ ] Cube/line/highlight restore to the resting grey state on release and on `destroy()`.
- [ ] Uniform scale still commits one history entry on release; bare click commits nothing.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #4-scale-restyle
