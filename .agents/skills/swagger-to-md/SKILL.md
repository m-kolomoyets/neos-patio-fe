---
name: swagger-to-md
description: Fetch a remote Swagger/OpenAPI (v2 or v3) spec from a URL and emit a directory of Markdown files (one per tag) documenting all endpoints, parameters, request payloads, and responses. Refs are inlined; request bodies are rendered as example JSON payloads. Use when user wants to convert a Swagger/OpenAPI URL to Markdown, document a remote API, snapshot endpoints from a backend, or asks "swagger to md" / "openapi to markdown".
---

# swagger-to-md

## Quick start

```bash
node .claude/skills/swagger-to-md/scripts/swagger-to-md.mjs <url-or-path> [outDir]
```

Example:

```bash
node .claude/skills/swagger-to-md/scripts/swagger-to-md.mjs https://example.com/api docs/api
```

Default output dir: `swagger-docs/` in cwd.

## What it does

- Auto-resolves doc URL. Tries direct, then `<url>-json` (NestJS), then `/swagger.json`, `/openapi.json`, `/v3/api-docs`, `/api-docs`.
- Accepts local JSON file path too.
- Supports OpenAPI 3.x and Swagger 2.0.
- Groups endpoints by `tags[0]` (respects `spec.tags` order, then alpha).
- Emits one Markdown file per tag plus `README.md` index linking each section.
- Per endpoint: method + path + summary, description, path/query/header/cookie params table, request body as example JSON payload, response codes + resolved schemas, security.
- `$ref` is fully inlined (cycle-safe). No separate Schemas section, no anchor links to chase.
- Request body is rendered as a sample JSON object (not raw schema) — types/formats become representative values (`"string"`, `0`, `false`, ISO date-time, UUID zeros, etc.). `enum` → first value. `oneOf`/`anyOf` → first branch. `allOf` → merged.
- Strips `example`/`examples` noise from response schemas.

## Output layout

```
<outDir>/
  README.md       # title, servers, links to each section
  <tag-slug>.md   # one file per tag (e.g. auth.md, users.md)
```

## Workflow

1. Run script with target URL and output dir.
2. Open `<outDir>/README.md` and follow links per section.
3. If fetch fails, script prints all probed URLs — pick correct one and re-run.

## When to use vs alternatives

- **This script** — zero deps, fast, runs offline once spec fetched. Default choice.
- **`widdershins`** — heavier, prettier output, needs `npm i -g widdershins`. Use only if user wants Slate-style multi-file docs with Code samples.
- **MCP** — none needed. Spec is plain JSON over HTTP.

## Notes

- Output is deterministic — safe to commit.
- Request body example values are placeholders, not real fixtures. Replace before sending real requests.
- Circular `$ref` chains terminate with `{ "$circular": "<SchemaName>" }` in responses and `null` in body samples.
