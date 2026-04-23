---
name: npm-audit-install
description: Audit npm packages for security vulnerabilities before installing them using npq. Use when user wants to install a new npm package, add a dependency, audit a package for security issues, or check if a package is safe.
---

# npm Audit Install

Security-first package installation using [npq](https://github.com/lirantal/npq).

## Workflows

### 1. Audit-only (readonly) mode

Check a package for security issues **without installing** it:

```bash
npx npq install <package-name> --dry-run --disable-auto-continue
```

- Runs all security checks (Snyk CVEs, typosquatting, scripts, age, downloads, license, repo, signatures, provenance, deprecation)
- Exits after reporting — nothing is installed
- Review the output and report findings to the user

### 2. Guarded install mode

Audit and install only if the package passes all checks:

```bash
npx npq install <package-name> --disable-auto-continue
```

- If any security issue is flagged, **do NOT proceed** with installation — inform the user of the risks
- If all checks pass, confirm with the user before proceeding

### 3. Multiple packages

Run each package through audit individually so issues are isolated:

```bash
npx npq install <pkg1> --dry-run --disable-auto-continue
npx npq install <pkg2> --dry-run --disable-auto-continue
```

Then install only the ones that passed.

## Rules

- **NEVER** install a package that has security issues flagged by npq
- Always use `--disable-auto-continue` to prevent auto-proceeding past warnings
- For audit-only requests, always use `--dry-run`
- Report all flagged issues to the user with clear explanation
- If Snyk CVEs are found, treat as a hard block — suggest alternatives

## Environment variables

| Variable | Purpose |
|---|---|
| `SNYK_TOKEN` | Enables Snyk vulnerability DB (recommended) |
| `GITHUB_TOKEN` | Increases GitHub API rate limits |
| `NPQ_PKG_MGR` | Override package manager (`npm`, `yarn`, `pnpm`) |