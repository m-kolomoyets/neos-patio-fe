## What to build

Two pure functions in the `FeaturedPatios` module's `utils/` that encapsulate the non-trivial magnetic-scrub math, with no DOM or React dependency:

- `computeMagneticTarget` — given the cursor position and both button centers, returns a single signed target velocity (fraction of video duration per second). Internally: euclidean distance to each button center, strength `t = clamp(1 - d/R, 0, 1)`, per-button contribution `t² · MAX_RATE`, next positive / prev negative, **net sum** of both contributions.
- `wrapTime` — wraps a time value modulo duration so forward overruns wrap `duration→0` and backward overruns wrap `0→duration`.

These are consumed by the hook in slice 02; this slice only delivers the functions and their types.

## Acceptance criteria

- [ ] `computeMagneticTarget` returns `±MAX_RATE` when cursor is exactly on a button center (correct sign: next +, prev −)
- [ ] Returns `0` when cursor is at or beyond field edge (`d >= R`) for both buttons
- [ ] Returns `~0` when cursor is equidistant inside both overlapping fields (contributions cancel)
- [ ] Exhibits t² falloff (half-radius → `0.25·MAX_RATE`, not `0.5`)
- [ ] `wrapTime` wraps forward past `duration` to a small positive value and backward past `0` to near `duration`; exact boundaries handled
- [ ] Both functions are pure (no DOM/React), typed, and scoped to the module `utils/`
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

None - can start immediately.
