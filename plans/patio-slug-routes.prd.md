# Patio Slug Routes — PRD

## Problem Statement

Every patio link today is an opaque database id: `/patios/5`. The URL says nothing about what is behind it. A user who copies a link into Slack, a document, or a browser bookmark loses all context — they cannot tell `/patios/5` from `/patios/9` without opening both. Links are also unshareable in any meaningful sense: nobody can guess, remember, or recognise them, and they carry zero signal to search engines or link previews.

The URL is the one piece of the product that travels outside the product. Right now it travels empty.

## Solution

Patio routes are addressed by a human-readable slug derived from the patio name:

- `/patios/mont-saint-michel` instead of `/patios/5`
- `/patios/mont-saint-michel/edit` instead of `/patios/5/edit`
- `/patios/id5` when a patio has no name, or a name that produces no usable slug

Slugs are ASCII, lowercase, hyphen-separated. Accented characters are folded to their plain Latin equivalents (`Château de Chambord` → `chateau-de-chambord`, `Sagrada Família` → `sagrada-familia`), so the URL stays clean and readable everywhere it is pasted — no percent-encoding, no mangling in plain-text contexts.

Existing id-based links keep working. Landing on `/patios/5` resolves the patio and quietly rewrites the address bar to the canonical slug, so old links never break but never persist either. Unknown refs render the app's not-found page instead of crashing.

## User Stories

1. As a user sharing a patio, I want the URL to contain the patio's name, so that the recipient knows what the link points to before opening it.
2. As a user pasting a patio link into Slack, I want it to render as readable text, so that it does not appear as a wall of percent-encoded characters.
3. As a user bookmarking a patio, I want the bookmark title and URL to be recognisable, so that I can find it later among many bookmarks.
4. As a user looking at my browser history, I want to distinguish patios by their URL alone, so that I can return to the right one.
5. As a user, I want the URL of a patio with an accented name to still be plain ASCII, so that it survives copy-paste through email, chat, and documents unchanged.
6. As a user opening a patio with a non-Latin name, I want a stable fallback URL rather than an unreadable encoded string, so that the link is still usable.
7. As a user, I want the editor URL to follow the same readable pattern as the view URL, so that both surfaces are consistent.
8. As a user who typed the slug with different capitalisation, I want the patio to still open, so that a hand-typed or auto-linkified URL is not punished.
9. As a user who arrives via a mistyped capitalisation, I want the address bar to correct itself to the canonical form, so that what I copy next is the right link.
10. As a user with an old id-based link, I want it to still open the correct patio, so that previously shared links do not break.
11. As a user arriving via an old id-based link, I want the address bar to settle on the pretty URL, so that the ugly form does not propagate further.
12. As a user who lands on a slug that does not exist, I want the app's not-found page, so that I understand what happened instead of seeing a blank screen or an error boundary.
13. As a user, I want the loading overlay and transition to feel exactly as fast as before, so that prettier URLs do not cost me perceived performance.
14. As a user in the editor who arrived via a non-canonical URL, I want the correction to keep me in the editor, so that I am not bounced back to the read-only view mid-edit.
15. As a user with search params or a hash on the URL, I want them preserved through the canonical correction, so that deep-linked state is not lost.
16. As a user clicking a patio from the home library, featured carousel, or action-bar search, I want to land directly on the slug URL, so that the canonical form is what I see from the first frame.
17. As a content author adding a patio fixture, I want the slug generated from the name automatically, so that I do not have to write it by hand.
18. As a content author, I want to override the generated slug on a specific patio, so that I can pin a nicer or legacy-compatible URL when the derived one reads badly.
19. As a content author, I want two patios with the same name to both remain reachable, so that a name collision does not silently hide one of them.
20. As a content author, I want a visible warning when a collision is auto-resolved, so that I know to set an explicit slug rather than shipping `chambord-2`.
21. As a developer, I want a single pure slug function, so that the same rules apply to fixtures, future API data, and any other feature that needs a slug.
22. As a developer, I want the slug lookup to be a prebuilt map rather than a linear scan, so that resolution stays constant-time as the patio set grows.
23. As a developer, I want one resolver that handles slug, `id<n>`, and bare id, so that the three URL forms are not special-cased across the app.
24. As a developer, I want the patio detail lookup to return `null` on a miss instead of a non-null assertion, so that unknown refs are a typed outcome rather than a runtime crash.
25. As a developer, I want the not-found and canonical-redirect rules in one shared hook, so that the view and editor cannot drift apart.
26. As a developer, I want the route loader to stay non-blocking, so that the existing page-transition overlay timing is untouched.
27. As a developer, I want `slug` to be a required field on the patio type, so that the eventual real API contract is expressed in the type system from day one.
28. As a developer, I want slugify and the slug index covered by tests, so that diacritic, transliteration, and collision edge cases cannot regress silently.
29. As a developer, I want the route param named `slug` rather than `id`, so that the parameter name does not lie about what it holds.
30. As a developer, I want the reserved `id<n>` form to be unreachable from a name-derived slug, so that the fallback namespace can never be shadowed by a real patio.

## Implementation Decisions

**URL shape**

- Slugs stay under the existing `/patios/` segment. A root-level `/<slug>` was rejected: it requires a catch-all that shadows every unmatched path, turns typos into patio lookups, and forces a permanent blacklist against top-level routes.
- Route param is renamed from `id` to `slug` across the view index and edit sub-route.
- Unnamed fallback token is `id<id>` (e.g. `id5`).

**Slug generation**

- A single pure function in the shared utils layer: `(name: string) => string`.
- Pipeline: Unicode NFD normalise → strip combining diacritics → apply a small transliteration map for characters NFD cannot decompose (`ø→o`, `æ→ae`, `ß→ss`, `ł→l`, `đ→d`, `þ→th`) → lowercase → collapse any run of non-`[a-z0-9]` into a single hyphen → trim leading/trailing hyphens.
- No length cap and no stop-word removal. Truncation was rejected because it manufactures new collisions and nothing in the current data approaches a problematic length.
- The function must guarantee its output can never take the reserved `id<digits>` form, so a name-derived slug can never shadow the fallback namespace.
- Empty output (e.g. a name written entirely in a non-Latin script) is the signal to use the `id<id>` fallback.

**Data model**

- `slug` becomes a required field on the patio type. This models the eventual API contract, where the backend owns slug assignment.
- The fixture input type keeps `slug` optional. The fixture factory derives it from the name unless an explicit value is supplied.
- Collisions are resolved by a dedupe pass when the fixture collection is assembled: the second and subsequent occurrences receive a numeric suffix (`-2`, `-3`) in definition order, accompanied by a development-only warning naming the colliding slug, the patio it was reassigned for, and the instruction to set an explicit slug. Throwing was rejected — a fixture typo should not take the whole app down, and the real API will own slugs eventually.
- The map-clustering point properties are unchanged. Cluster points do not navigate to patio detail, so they do not need a slug.

**Lookup and resolution**

- A slug index module builds a `Map` from canonical slug to patio once, and owns the collision dedupe. Pure and testable in isolation.
- The service exposes a single resolver taking one ref string and returning the patio or `null`. It lowercases the incoming ref, then tries, in order: the slug map, the `id<n>` form, and a bare id (legacy support).
- Tolerance stops at case. Underscore, space, and punctuation variants are not normalised — running arbitrary input back through slugify was rejected because the function is lossy, so unrelated garbage could accidentally resolve to a real patio.
- The previous non-null assertion on patio lookup is removed; the resolver's return type is nullable.

**Caching**

- The detail query is keyed by the ref as it appears in the URL. This mirrors a real `GET /patios/:slug` endpoint and requires no pre-resolution step in the loader.
- Because non-canonical refs are redirected immediately, only canonical slugs persist as cache keys in steady state. A legacy id hit leaves one transient duplicate entry, which is harmless.
- The object-update mutation continues to key by the patio's stable id and to invalidate at the patios root.

**Routing behaviour**

- The route loader stays non-blocking prefetch. A blocking loader with a loader-level redirect was rejected: navigation would then wait on the fetch before unmounting the previous route, shifting the page-transition overlay's start-to-reveal timing and requiring the transition context's seeding logic to be re-validated.
- Not-found and canonical-redirect handling therefore live in the component, after the suspense query resolves. A `null` result throws the router's not-found; a ref that differs from the patio's canonical slug triggers a replacing navigation in an effect.
- Both behaviours live in one shared hook consumed by the view and the editor, so the rule exists in exactly one place.
- The redirect targets the current route rather than a hard-coded path, so the editor stays on its `/edit` sub-route and search params and hash are preserved. Each module supplies its own route-scoped navigate function to the hook.
- The page-transition path matcher already accepts any single non-slash segment and needs no change.

**Call sites**

- The three navigation entry points — action-bar autocomplete, featured patio card, and the shared patio-transition navigate hook — all already hold a full patio object, so each becomes a parameter swap. The transition hook's seed type gains `slug`.

**Open question (client)**

- A message has been drafted asking the client whether they prefer the cleaned ASCII slug or the original name with minimal transformation. This PRD specifies the cleaned-ASCII behaviour. If the client chooses original-name preservation, only the slug generation function changes — the routing, resolution, caching, and redirect design are unaffected.

## Testing Decisions

**What makes a good test here.** These tests assert external behaviour only: given a name, what slug comes out; given a set of patios, what the index contains. They must not assert on the shape of intermediate values, the order of internal normalisation steps, or whether a transliteration map is a `Map` or an object literal. A rewrite of slugify's internals that preserves every input-output pair should not break a single test.

**Prior art.** There is none — the repository has no test runner today, and every prior plan in `./plans` was verified manually. This PRD introduces Vitest with a minimal configuration. Because only pure functions are covered, no DOM environment, jsdom, or React testing library is required.

**Modules under test.**

- The slugify function.
- The slug index builder.

The resolver, the shared hook, the routes, and the modified call sites are verified manually in the running app. The resolver is thin glue over the index; the hook is React lifecycle wiring that would require a DOM environment for marginal value.

**Cases to cover — slugify.**

- Plain multi-word ASCII name.
- Combining-diacritic names that NFD decomposes: the accented and macron-bearing fixture names.
- Characters NFD cannot decompose, one per transliteration map entry.
- Apostrophes and periods, which vanish rather than becoming separators.
- Ampersands and other punctuation runs, which collapse to a single hyphen rather than several.
- Leading and trailing punctuation, which must not leave dangling hyphens.
- Consecutive separators collapsing to one.
- Already-slug-shaped input, which must be idempotent.
- A name written entirely in a non-Latin script, which must produce the empty string so the caller can fall back.
- A name that would otherwise produce the reserved `id<digits>` form, which must be transformed so it cannot collide with the fallback namespace.
- Mixed-case input, which must lowercase.

**Cases to cover — slug index.**

- Every patio is reachable by its canonical slug.
- A patio with an explicit fixture slug uses that value, not the derived one.
- A patio whose name yields an empty slug is indexed under its `id<n>` fallback.
- Two patios with identical names: the first keeps the base slug, the second receives the `-2` suffix, and both remain independently reachable.
- Three-way collisions increment correctly.
- A collision emits the development warning.
- An explicit slug that collides with a derived one is also deduped rather than silently overwriting.
- The index is stable across repeated builds from the same input.

## Out of Scope

- Persisting or editing slugs from the UI. Slugs are derived data; there is no rename flow.
- Slug history or permanent redirects for renamed patios. Nothing in the product renames a patio today.
- Server-side slug generation, uniqueness enforcement, or an API contract change. The fixture layer stands in for the backend.
- Search-engine metadata, canonical link tags, Open Graph tags, or sitemap generation. This is a single-page admin surface with no crawler story yet.
- Slugs for any entity other than patios.
- A share or copy-link affordance in the UI. No such control exists today; the slug is URL-only.
- Fuzzy or typo-tolerant slug matching beyond case-insensitivity.
- Adding tests to any pre-existing untested module. The Vitest setup is introduced for this feature; retrofitting the rest of the codebase is separate work.

## Further Notes

- All fourteen current fixture names fold cleanly to non-empty ASCII slugs, and all fourteen are unique. The fallback and collision paths are therefore defensive today and exercised only by tests — which is precisely why they need tests.
- Legacy bare-id support costs roughly three lines. No patio links are persisted anywhere outside the running app today, so its practical value is close to zero; it is retained cheaply as insurance against links already shared in chat during development.
- The route file renames force a regeneration of the generated route tree. Any stale generated file will surface as a type error rather than a runtime failure.
- Introducing Vitest adds the first test tooling to the repository. Keeping the initial surface to two pure modules means no DOM shims, no Cesium mocking, and no interaction with the React Compiler build pipeline.
