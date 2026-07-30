# 04 — Alternate refs and canonical redirect

## What to build

Make every non-canonical way of addressing a patio resolve, then quietly correct itself.

The resolver gains its full lookup order. It lowercases the incoming ref, then tries the slug map, then the `id<n>` form used by patios with no usable name-derived slug, then a bare id for legacy links. Tolerance stops at case: underscore, space, and punctuation variants are not normalised. Running arbitrary input back through slugify was rejected because the function is lossy, so unrelated garbage could accidentally resolve to a real patio.

Whenever the ref in the URL differs from the patio's canonical slug, the address bar is corrected by a replacing navigation, so the ugly form never propagates further and whatever the user copies next is the right link.

The correction targets the current route rather than a hard-coded path. This matters: a hard-coded view path would eject a user who arrived at the editor via a legacy URL back into read-only mode mid-edit. Each module supplies its own route-scoped navigate function, which also preserves search params and hash through the correction.

This behaviour lives in a shared hook consumed by both the view and the editor, so the rule exists in exactly one place and the two surfaces cannot drift.

Because non-canonical refs are corrected immediately, only canonical slugs persist as query cache keys in steady state; a legacy hit leaves one transient duplicate entry, which is harmless and expected.

## Acceptance criteria

- [ ] The resolver lowercases the ref, then tries slug map, then `id<n>`, then bare id
- [ ] `/patios/id5` resolves the corresponding unnamed patio
- [ ] `/patios/5` resolves and then rewrites to `/patios/mont-saint-michel`
- [ ] `/patios/Mont-Saint-Michel` resolves and then rewrites to the lowercase canonical form
- [ ] `/patios/ID5` resolves and rewrites to `/patios/id5`
- [ ] `/patios/mont_saint_michel` does not resolve — no fuzzy matching
- [ ] The canonical correction uses a replacing navigation, so the browser back button does not return to the non-canonical URL
- [ ] `/patios/5/edit` rewrites to `/patios/mont-saint-michel/edit` and stays in the editor
- [ ] Search params and hash survive the correction
- [ ] The resolve, tolerance, and correction rules live in one shared hook used by both the view and the editor
- [ ] A legacy-ref visit leaves at most one transient extra cache entry; the canonical key is what persists
- [ ] `pnpm test`, `pnpm lint`, and `pnpm tsc` pass

## Blocked by

- Blocked by `03-slug-routes-end-to-end.issue.md`
