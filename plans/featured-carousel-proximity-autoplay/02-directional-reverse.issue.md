## What to build

Add directional behavior to the proximity autoplay. `computeMagneticTarget` already returns a signed value (positive near the next arrow, negative near the prev arrow). Use the sign to choose direction: positive → `scrollNext`, negative → `scrollPrev`. Magnitude still drives speed exactly as in the forward slice.

On the looping (non-reduced-motion) carousel, backward autoplay wraps around correctly from the first slide to the last.

## Acceptance criteria

- [ ] Cursor in the prev-arrow zone advances slides backward (`scrollPrev`).
- [ ] Cursor in the next-arrow zone still advances forward.
- [ ] Speed (interval) is driven by proximity magnitude in both directions.
- [ ] Backward autoplay wraps around correctly on the looping carousel.
- [ ] Overlapping zones near both arrows cancel via the signed sum (inherited from the shared util) — no jitter.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-forward-proximity-autoplay
