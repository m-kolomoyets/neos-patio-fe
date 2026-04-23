# Reference — generate-browserslist

## Intersection algorithm

Browserslist's own query syntax (`A, B`) is a **union**. We need the opposite: the set of browsers supported by **every** dependency. The approach:

1. For each dep `d` with a declared browserslist query `q_d`, compute the concrete browser list:
   ```js
   import browserslist from "browserslist";
   const set_d = new Set(browserslist(q_d, { path: depPath }));
   ```
   Each entry looks like `"chrome 111"`, `"safari 16.4"`, etc.

2. Compute the project baseline set the same way (default query `defaults`, run from the project root so the project's own `.browserslistrc` or `package.json` is respected if present).

3. Intersect: `final = baseline ∩ set_d1 ∩ set_d2 ∩ ...`

4. Collapse to lowest-version-per-browser:
   ```
   chrome 111, chrome 112, chrome 113 → chrome >= 111
   ```
   Emit as `"chrome >= 111"` strings in `package.json.browserslist`.

### Why intersection and not union?

If dep A drops IE 11 support and dep B still supports it, shipping IE 11 would break whenever dep A is called. Conversely, if dep B already dropped IE 11, targeting IE 11 is pointless. The safe target is the common subset.

### Caveats

- **Minor version granularity.** browserslist reports entries like `safari 16.4`. Intersect at that granularity; collapsing to `safari >= 16.4` is done only in the final output step.
- **`not` queries.** A dep can declare `defaults, not ie 11`. `browserslist(query)` already resolves negations, so the resulting set is correct — no special handling needed.
- **Dep with empty/invalid query.** Skip with a warning; don't let one broken dep zero out the intersection.

## Dep discovery

Order:
1. `dependencies` from the project `package.json`.
2. `peerDependencies` (the consumer ships these).
3. `devDependencies` only with `--include-dev`.

For each dep name:
- Locate `node_modules/<name>/package.json` (respect workspaces — resolve via `require.resolve` if available).
- Check `package.json.browserslist` (string or array).
- Else check `node_modules/<name>/.browserslistrc`.
- Else the dep does not constrain targets — skip.

Transitive deps are intentionally **not** walked: direct deps' maintainers are responsible for declaring their effective browser support, so walking transitively double-counts and slows the run dramatically.

## Vite config AST edit strategy

Do **not** regex the file. Use a JS/TS parser:

1. Parse `vite.config.ts` (or `.js`/`.mts`/`.mjs`) with `@babel/parser` in `module` mode with `typescript` + `jsx` plugins.
2. Walk to the `defineConfig({ ... })` call — or, if the user exports a plain object, the `export default { ... }` node.
3. Find the `build` property. If missing, insert `build: { target: [...] }`.
4. Find `build.target`. If missing, insert it. If present, replace its value with an `ArrayExpression` of string literals (`chrome111`, `safari16.4`, ...).
5. Regenerate with `@babel/generator`, preserving the rest of the source as closely as possible (use `retainLines: true` when reasonable).
6. Run Prettier on the output if the project has Prettier configured (detect via `.prettierrc*` or `prettier` key in `package.json`).

If the config is dynamic (e.g. `export default ({ mode }) => defineConfig({ ... })`), descend into the returned object expression. If the target value is not a literal array (e.g. computed), abort with a clear message — refuse to overwrite user logic.

## browserslist → esbuild target mapping

Supported esbuild targets (as of esbuild 0.19+):
`chrome`, `edge`, `firefox`, `hermes`, `ie`, `ios`, `node`, `opera`, `rhino`, `safari`.

Mapping table the script uses:

| browserslist id | esbuild prefix | Notes |
|---|---|---|
| `chrome` | `chrome` | direct |
| `edge` | `edge` | direct |
| `firefox` | `firefox` | direct |
| `ie` | `ie` | direct (but usually dropped by modern deps) |
| `safari` | `safari` | direct |
| `ios_saf` | `ios` | direct |
| `opera` | `opera` | direct |
| `samsung` | — | drop (no esbuild target) |
| `and_chr` | — | drop (covered by `chrome`) |
| `and_ff` | — | drop (covered by `firefox`) |
| `and_uc` | — | drop |
| `op_mob` | — | drop |
| `op_mini` | — | drop |
| `kaios` | — | drop |
| `baidu` | — | drop |

Format: `<prefix><version>`. browserslist versions can include dots (`safari 16.4` → `safari16.4`) or a range (`ios_saf 16.4-16.6` → use the lower bound: `ios16.4`).

## Report output (`--json`)

```json
{
  "baseline": "defaults",
  "projectRoot": "/abs/path",
  "deps": {
    "react": { "query": ["defaults"], "browsers": ["chrome 111", "..."] },
    "some-lib": { "query": ["> 1%", "not dead"], "browsers": ["..."] }
  },
  "skipped": ["lodash", "tiny-util"],
  "intersection": ["chrome 111", "firefox 115", "safari 16.4", "edge 111"],
  "browserslist": ["chrome >= 111", "firefox >= 115", "safari >= 16.4", "edge >= 111"],
  "viteTarget": ["chrome111", "firefox115", "safari16.4", "edge111"]
}
```

## Exit codes

- `0` — success (audit clean or write completed).
- `1` — intersection is empty; nothing written.
- `2` — I/O or parse failure (missing `package.json`, unparseable `vite.config.*`, etc.).
