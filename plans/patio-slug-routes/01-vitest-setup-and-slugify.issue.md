# 01 — Vitest setup and slugify

## What to build

The repository has no test runner. Introduce Vitest with the smallest viable configuration — no DOM environment, no jsdom, no React testing library, since everything under test in this feature is a pure function. Add a test script alongside the existing lint and tsc scripts.

Then build the slug generation function in the shared utils layer: a pure `(name: string) => string` with no knowledge of patios.

The pipeline is: Unicode NFD normalise, strip combining diacritics, apply a small transliteration map for the characters NFD cannot decompose (`ø→o`, `æ→ae`, `ß→ss`, `ł→l`, `đ→d`, `þ→th`), lowercase, collapse every run of non-`[a-z0-9]` into a single hyphen, trim leading and trailing hyphens.

Two invariants matter beyond the happy path. Output must never take the reserved `id<digits>` form, so a real name can never shadow the unnamed-patio fallback namespace introduced in slice 04. And a name that produces nothing usable — a name written entirely in a non-Latin script, for instance — must return the empty string, which is the signal downstream callers use to fall back.

No length cap and no stop-word removal: truncation manufactures collisions and nothing in the data approaches a problematic length.

## Acceptance criteria

- [x] Vitest installed via pnpm and wired into a `test` script in `package.json`; `pnpm test` runs green
- [x] Vitest config is minimal — no DOM environment, no Cesium or asset mocking
- [x] `slugify` lives in the shared utils layer, is pure, and imports nothing from the patios service
- [x] Multi-word ASCII names produce lowercase hyphen-separated output
- [x] Combining diacritics are folded: `Sagrada Família` → `sagrada-familia`, `Tōdai-ji` → `todai-ji`
- [x] Each transliteration map entry is exercised by at least one case, including `København` → `kobenhavn`
- [x] Apostrophes and periods are removed rather than becoming separators: `St. Basil's` → `st-basils`
- [x] Punctuation runs collapse to a single hyphen: `Ros & Co` → `ros-co`
- [x] Leading and trailing punctuation leaves no dangling hyphen
- [x] Consecutive separators collapse to one
- [x] Already-slug-shaped input is idempotent
- [x] A name in a wholly non-Latin script returns the empty string
- [x] A name that would otherwise produce the reserved `id<digits>` form is transformed so it cannot collide
- [x] Mixed-case input is lowercased
- [x] Tests assert input-output pairs only — no assertions on intermediate values, normalisation order, or the internal shape of the transliteration map
- [x] `pnpm lint` and `pnpm tsc` pass

## Blocked by

- Blocked by `00-confirm-slug-style-with-client.issue.md`
