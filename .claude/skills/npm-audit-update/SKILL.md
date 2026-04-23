---
name: npm-audit-update
description: Check project dependencies for available updates, audit each candidate for security, and safely update package.json and reinstall. Use when the user wants to update dependencies, check for outdated packages, upgrade versions, or refresh a lockfile safely. Complements npm-audit-install (single-package installs).
---

# npm Audit Update

Security-first bulk dependency updates. Pairs `npm outdated` / `npm-check-updates` with [`npq`](https://github.com/lirantal/npq) so every upgrade candidate is audited before it lands in `package.json`.

## Workflow

### 1. Discover outdated packages

```bash
npm outdated --json || true   # exits non-zero when there are outdated pkgs
```

For major-version bumps (outside the semver range in `package.json`), also run:

```bash
npx npm-check-updates --jsonUpgraded
```

Report to the user:
- Current → Wanted (in-range) vs Current → Latest (major)
- `dependencies` vs `devDependencies`
- Anything pinned/ignored

### 2. Audit current tree

```bash
npm audit --json || true
```

Note any existing advisories so they can be cross-checked against candidate upgrades (some updates fix advisories).

### 3. Audit each update candidate

Run npq in dry-run against the **target version** for every package the user wants to bump:

```bash
npx npq install <pkg>@<target-version> --dry-run --disable-auto-continue
```

- Do one package at a time so failures are isolated
- A "safe" result = no Snyk CVEs, no typosquatting, no install-scripts warning you can't justify, not deprecated, reasonable age/downloads
- Build two lists: `SAFE` and `BLOCKED` (with the reason)

### 4. Confirm with the user

Show the `SAFE` / `BLOCKED` split. Do **not** proceed without explicit approval, especially when:
- Any major-version bump is involved (breaking changes expected)
- A package is blocked (user may want an alternative)
- More than ~5 packages will change at once

### 5. Apply updates

Prefer editing `package.json` + a clean install over ad-hoc `npm install pkg@ver` so the lockfile is regenerated predictably.

In-range (minor/patch) only:
```bash
npm update <pkg1> <pkg2> ...
```

Out-of-range (major) bumps — update the manifest, then reinstall:
```bash
npx npm-check-updates -u <pkg1> <pkg2> ...   # rewrites package.json
npm install
```

### 6. Verify post-install

Run in this order and stop on the first failure:

```bash
npm audit                 # no new advisories introduced
npm run tsc               # or the project's typecheck script
npm run lint:eslint       # or the project's lint script
npm test --if-present
npm run build --if-present
```

If anything breaks, offer to revert via `git checkout -- package.json package-lock.json` before trying a narrower set of upgrades.

## Rules

- **NEVER** bump a package that npq flags with a Snyk CVE or typosquatting warning — hard block
- **NEVER** bulk-update without showing the candidate list first
- Respect the project's package manager (this repo pins npm via `engines`; do not switch to yarn/pnpm)
- Keep `dependencies` and `devDependencies` updates in separate commits when practical
- Do not touch `package-lock.json` by hand — let `npm install` regenerate it
- For single-package installs (not updates), defer to the `npm-audit-install` skill

## Quick reference

| Need | Command |
|---|---|
| List outdated (in-range) | `npm outdated` |
| List outdated (incl. major) | `npx npm-check-updates` |
| Audit existing tree | `npm audit` |
| Audit a target version | `npx npq install <pkg>@<ver> --dry-run --disable-auto-continue` |
| Apply in-range updates | `npm update <pkg>...` |
| Apply major updates | `npx npm-check-updates -u <pkg>... && npm install` |
| Revert | `git checkout -- package.json package-lock.json` |
