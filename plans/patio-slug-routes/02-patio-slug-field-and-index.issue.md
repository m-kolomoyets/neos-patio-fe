# 02 — Patio slug field and slug index

## What to build

Give every patio a slug, and build the lookup structure that makes slugs addressable.

`slug` becomes a required field on the patio type. This models the eventual API contract, where the backend owns slug assignment — the fixture layer is standing in for it. The fixture input type keeps `slug` optional, and the fixture factory derives it from the name unless an explicit value is supplied, so authors get correct slugs for free but can pin a nicer one when the derived version reads badly.

Alongside it, a slug index module: pure, taking the patio collection and returning a `Map` from canonical slug to patio, so resolution is constant-time rather than a linear scan.

The index owns collision resolution. When two patios produce the same slug, the first keeps the base value and subsequent ones receive a numeric suffix in definition order (`chambord`, `chambord-2`, `chambord-3`). Every colliding patio stays independently reachable — silently overwriting would make one unreachable and be undebuggable. Each auto-resolution emits a development-only warning naming the colliding slug, the patio it was reassigned for, and the instruction to set an explicit slug in the fixture.

An explicit fixture slug is not exempt: if it collides with a derived one, it is deduped by the same rule.

Nothing routes by slug yet — this slice ends with correct data and a correct index, verified by tests.

## Acceptance criteria

- [x] `slug` is a required field on the patio type
- [x] The fixture input type keeps `slug` optional
- [x] The fixture factory derives the slug from the name via `slugify` when none is supplied
- [x] An explicit fixture slug takes precedence over the derived one
- [x] The slug index is a separate pure module returning a `Map` from slug to patio
- [x] All fourteen current fixtures are reachable by their canonical slug, and all fourteen slugs are unique with no suffixes applied
- [x] A patio whose name yields an empty slug is indexed under its `id<n>` fallback
- [x] Two patios with identical names: the first keeps the base slug, the second gets `-2`, both independently reachable
- [x] Three-way collisions increment correctly
- [x] An explicit slug colliding with a derived one is deduped rather than overwriting
- [x] Each auto-resolved collision emits a development-only warning identifying the slug and the affected patio
- [x] The index is stable across repeated builds from the same input
- [x] Map-clustering point properties are unchanged — cluster points do not navigate to patio detail and do not need a slug
- [x] `pnpm test`, `pnpm lint`, and `pnpm tsc` pass

## Blocked by

- Blocked by `01-vitest-setup-and-slugify.issue.md`
