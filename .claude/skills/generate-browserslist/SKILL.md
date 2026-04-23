---
name: generate-browserslist
description: Generate a project-wide browserslist configuration that is compatible with every declared dependency's own browserslist settings by intersecting the supported browser sets, then sync the result to Vite's build.target. Use when the user wants to create, update, or audit the `browserslist` field / `.browserslistrc`, keep Vite's `build.target` in lockstep with it, ensure dependency compatibility, or debug "unsupported target" build warnings.
---

# Generate Browserslist

Produces a browserslist configuration for the current project that is the **intersection** of every main dependency's declared browserslist — i.e. the resulting target list only includes browsers supported by *all* deps — and syncs the result into `vite.config.*` at `build.target`.

## Quick start

```bash
node .claude/skills/generate-browserslist/scripts/generate.mjs
```

The script:

1. Reads `dependencies` (and optionally `devDependencies`) from the project's `package.json`.
2. For each dep, reads its installed `node_modules/<dep>/package.json` and `.browserslistrc`.
3. Resolves each dep's declared browserslist query to a concrete browser list via the `browserslist` package.
4. Intersects all lists with the project's current baseline query (default: `defaults`).
5. Prints the result. With `--write`, persists it to:
   - `package.json` → `browserslist`, **and**
   - `vite.config.{ts,js,mts,mjs}` → `build.target` (converted to esbuild-compatible target strings like `chrome111`, `safari16.4`).

## Workflow

1. **Run audit first** (no writes):
   ```bash
   node .claude/skills/generate-browserslist/scripts/generate.mjs
   ```
   Review which deps contribute constraints and which browsers got dropped.

2. **Show the user** the list of deps that declare a browserslist and the proposed final config (both the `browserslist` entries and the derived Vite `build.target` array).

3. **Confirm** with the user before writing, then:
   ```bash
   node .claude/skills/generate-browserslist/scripts/generate.mjs --write
   ```

4. **Verify**:
   ```bash
   npx browserslist            # lists the resolved browsers
   npx vite build              # confirms Vite accepts the new target
   ```

## Options

| Flag | Effect |
|---|---|
| `--write` | Persist to `package.json` → `browserslist` **and** `vite.config.*` → `build.target`. Without it, only prints. |
| `--include-dev` | Also consider `devDependencies` (off by default — build tools often declare very loose targets). |
| `--baseline "<query>"` | Starting query to intersect against (default: `defaults`). |
| `--only <pkg,pkg>` | Restrict to specific deps (useful for debugging which dep is dropping a browser). |
| `--no-vite` | Skip Vite config update (only touch `package.json`). |
| `--json` | Emit a JSON report of per-dep queries and the final intersection. |

## Rules

- **Never write without `--write`.** Always show the user the diff first (both files).
- If a dep has no browserslist declaration, skip it (it does not constrain targets).
- Prefer the `package.json` `browserslist` field over `.browserslistrc` if both exist in the dep.
- If intersection is empty, **do not write either file** — report conflicting deps and ask the user how to proceed.
- `peerDependencies` are treated like `dependencies` when `--include-dev` is off.
- When updating `vite.config.*`, preserve the rest of the config verbatim. Only replace the `build.target` value; if `build` or `build.target` is missing, insert it. Use AST edits (not regex) to avoid corrupting the file.

## Mapping browserslist → Vite `build.target`

Vite's `build.target` accepts an array of esbuild target strings. The script maps browserslist entries like:

| browserslist | Vite target |
|---|---|
| `chrome 111` | `chrome111` |
| `safari 16.4` | `safari16.4` |
| `firefox 115` | `firefox115` |
| `edge 111` | `edge111` |
| `ios_saf 16.4` | `ios16.4` |
| `and_chr 120` | *(dropped — esbuild has no Android Chrome target; Chrome desktop covers it)* |
| `op_mini all` | *(dropped — unsupported by esbuild)* |

The script emits the **lowest supported version per browser** from the intersection, since esbuild compiles down to the lowest target.

## When intersection is empty

1. Run with `--json` to see per-dep sets.
2. Identify the dep with the tightest constraint.
3. Either upgrade/replace it, or exclude it via `--only` after discussing with the user.

See [REFERENCE.md](REFERENCE.md) for the intersection algorithm, Vite config AST edit strategy, and edge cases.
