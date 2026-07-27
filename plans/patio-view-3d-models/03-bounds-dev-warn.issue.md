# Bounds dev-warn

## What to build

Guard against mis-authored fixtures. The pure placement plan flags any object
whose lng/lat falls outside the patio bounds `[west, south, east, north]`. In
development builds only, emit a `console.warn` naming the offending object. The
view still renders objects as authored — no clamping, no dropping. Trust fixture
authoring; this is a developer safety net.

## Acceptance criteria

- [ ] Placement plan reports out-of-bounds objects (including on-edge cases handled sanely)
- [ ] A `console.warn` fires in development when an object is outside bounds
- [ ] No warning in production builds
- [ ] Out-of-bounds objects are still rendered (no clamp, no skip)
- [ ] In-bounds objects produce no warning

## Blocked by

- Blocked by #01-tracer-one-model-renders
