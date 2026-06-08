## What to build

Lighten the rotate rings by reducing the torus tube radius (~`0.04` → ~`0.022`),
keeping the torus topology. No other rotate changes — colors, sector, badge, and
commit path stay exactly as they are.

## Acceptance criteria

- [ ] Rotate ring tube radius reduced so the rings read thinner.
- [ ] Rings remain tori (same shape/topology), still pickable.
- [ ] Rotate colors, swept sector, degree badge, and commit behavior unchanged.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
