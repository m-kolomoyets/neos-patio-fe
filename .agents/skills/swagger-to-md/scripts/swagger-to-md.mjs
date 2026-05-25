#!/usr/bin/env node
// Convert remote Swagger/OpenAPI (v2 or v3) to a directory of Markdown files (one per tag).
// Usage: node swagger-to-md.mjs <swagger-url-or-path> [outDir]
// Resolves common doc URLs (e.g. /api -> /api-json, /api/swagger.json, /v3/api-docs).
// $refs are inlined (cycle-safe). Request bodies rendered as example JSON payloads.

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const CANDIDATE_SUFFIXES = [
  "",
  "/swagger.json",
  "/openapi.json",
  "/v3/api-docs",
  "/api-docs",
];

const input = process.argv[2];
const outDir = process.argv[3] ?? "swagger-docs";
if (!input) {
  console.error("Usage: swagger-to-md.mjs <url-or-path> [outDir]");
  process.exit(1);
}

const spec = await loadSpec(input);
const files = render(spec);
mkdirSync(outDir, { recursive: true });
let totalChars = 0;
for (const { name, content } of files) {
  writeFileSync(join(outDir, name), content);
  totalChars += content.length;
}
console.log(`Wrote ${files.length} files to ${outDir}/ (${totalChars} chars total)`);

async function loadSpec(src) {
  if (existsSync(src)) return JSON.parse(readFileSync(src, "utf8"));

  const tried = [];
  const bases = [src];
  if (!src.endsWith("-json")) bases.push(`${src.replace(/\/$/, "")}-json`);
  for (const base of bases) {
    for (const suf of CANDIDATE_SUFFIXES) {
      const u = `${base.replace(/\/$/, "")}${suf}`;
      tried.push(u);
      try {
        const res = await fetch(u, { headers: { Accept: "application/json" } });
        if (!res.ok) continue;
        const ct = res.headers.get("content-type") ?? "";
        if (!ct.includes("json")) continue;
        return await res.json();
      } catch {}
    }
  }
  throw new Error(`Could not fetch spec. Tried:\n${tried.join("\n")}`);
}

function render(spec) {
  const isV3 = !!spec.openapi;
  const title = spec.info?.title ?? "API";
  const version = spec.info?.version ?? "";
  const desc = spec.info?.description ?? "";

  const tagsOrder = (spec.tags ?? []).map((t) => t.name);
  const groups = groupByTag(spec.paths ?? {}, tagsOrder);

  const ctx = { spec, isV3 };

  const files = [];

  // Index file (README.md)
  const idx = [];
  idx.push(`# ${title}${version ? ` v${version}` : ""}`);
  if (desc) idx.push("", desc);
  if (spec.servers?.length) {
    idx.push("", "## Servers", "", ...spec.servers.map((s) => `- \`${s.url}\`${s.description ? ` — ${s.description}` : ""}`));
  } else if (spec.host) {
    const scheme = (spec.schemes ?? ["https"])[0];
    idx.push("", "## Server", "", `- \`${scheme}://${spec.host}${spec.basePath ?? ""}\``);
  }
  idx.push("", "## Sections", "");
  for (const [tag] of groups) idx.push(`- [${tag}](./${slug(tag)}.md)`);
  files.push({ name: "README.md", content: idx.join("\n") + "\n" });

  // Per-tag files
  for (const [tag, ops] of groups) {
    const lines = [];
    lines.push(`# ${tag}`, "", `[← Index](./README.md)`, "");
    for (const op of ops) lines.push(...renderOp(op, ctx));
    files.push({ name: `${slug(tag)}.md`, content: lines.join("\n") + "\n" });
  }

  return files;
}

function groupByTag(paths, order) {
  const map = new Map();
  for (const [path, item] of Object.entries(paths)) {
    for (const method of ["get", "post", "put", "patch", "delete", "head", "options"]) {
      const op = item[method];
      if (!op) continue;
      const tag = op.tags?.[0] ?? "default";
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag).push({ method: method.toUpperCase(), path, op });
    }
  }
  const sorted = [...map.entries()].sort(([a], [b]) => {
    const ai = order.indexOf(a), bi = order.indexOf(b);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 1e9 : ai) - (bi === -1 ? 1e9 : bi);
    return a.localeCompare(b);
  });
  for (const [, ops] of sorted) ops.sort((x, y) => x.path.localeCompare(y.path) || x.method.localeCompare(y.method));
  return sorted;
}

function renderOp({ method, path, op }, ctx) {
  const { isV3 } = ctx;
  const lines = [];
  const summary = op.summary ?? op.operationId ?? "";
  lines.push(`## \`${method}\` ${path}${summary ? ` — ${summary}` : ""}`);
  if (op.description) lines.push("", op.description);
  if (op.deprecated) lines.push("", "> **Deprecated**");

  const params = op.parameters ?? [];
  const grouped = { path: [], query: [], header: [], cookie: [] };
  for (const p of params) {
    const key = p.in ?? "query";
    if (grouped[key]) grouped[key].push(p);
  }
  for (const [where, list] of Object.entries(grouped)) {
    if (!list.length) continue;
    lines.push("", `**${cap(where)} parameters**`, "", "| Name | Type | Required | Description |", "| --- | --- | --- | --- |");
    for (const p of list) {
      const t = typeOf(resolve(p.schema ?? p, ctx));
      lines.push(`| \`${p.name}\` | ${t} | ${p.required ? "yes" : "no"} | ${oneLine(p.description)} |`);
    }
  }

  const body = isV3 ? op.requestBody : params.find((p) => p.in === "body");
  if (body) {
    lines.push("", "**Request body**", "");
    if (isV3) {
      const content = body.content ?? {};
      for (const [mt, def] of Object.entries(content)) {
        lines.push(`- \`${mt}\``);
        if (def.schema) {
          const sample = schemaToExample(def.schema, ctx);
          lines.push("", "```json", JSON.stringify(sample, null, 2), "```");
        }
      }
    } else if (body.schema) {
      const sample = schemaToExample(body.schema, ctx);
      lines.push("```json", JSON.stringify(sample, null, 2), "```");
    }
  }

  const responses = op.responses ?? {};
  if (Object.keys(responses).length) {
    lines.push("", "**Responses**", "");
    for (const [code, rRaw] of Object.entries(responses)) {
      const r = resolve(rRaw, ctx);
      lines.push(`- \`${code}\` — ${oneLine(r.description) || ""}`);
      const content = isV3 ? r.content : r.schema ? { "application/json": { schema: r.schema } } : null;
      if (content) {
        for (const [mt, def] of Object.entries(content)) {
          if (def.schema) {
            const resolved = resolveDeep(def.schema, ctx);
            lines.push("", `  \`${mt}\``, "", "  ```json", indent(JSON.stringify(resolved, null, 2), "  "), "  ```");
          }
        }
      }
    }
  }

  if (op.security) {
    lines.push("", `**Security**: ${op.security.map((s) => Object.keys(s).join("+")).join(", ") || "none"}`);
  }
  lines.push("");
  return lines;
}

// Resolve a single $ref one level (returns inlined object).
function resolve(node, ctx, seen = new Set()) {
  if (!node || typeof node !== "object") return node;
  if (node.$ref && !seen.has(node.$ref)) {
    const next = lookupRef(node.$ref, ctx.spec);
    if (next) {
      const ns = new Set(seen); ns.add(node.$ref);
      return resolve(next, ctx, ns);
    }
  }
  return node;
}

// Deep-resolve all $refs inside a schema, with cycle guard. Returns a stripped copy.
function resolveDeep(node, ctx, seen = new Set()) {
  if (!node || typeof node !== "object") return node;
  if (Array.isArray(node)) return node.map((n) => resolveDeep(n, ctx, seen));
  if (node.$ref) {
    if (seen.has(node.$ref)) return { $circular: refName(node.$ref) };
    const target = lookupRef(node.$ref, ctx.spec);
    if (!target) return { $unresolved: node.$ref };
    const ns = new Set(seen); ns.add(node.$ref);
    return resolveDeep(target, ctx, ns);
  }
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (k === "example" || k === "examples") continue;
    out[k] = resolveDeep(v, ctx, seen);
  }
  return out;
}

function lookupRef(ref, spec) {
  if (!ref.startsWith("#/")) return null;
  const parts = ref.slice(2).split("/").map(decodeURIComponent);
  let cur = spec;
  for (const p of parts) {
    if (cur == null) return null;
    cur = cur[p.replaceAll("~1", "/").replaceAll("~0", "~")];
  }
  return cur ?? null;
}

// Build an example JSON value from a schema (refs resolved, cycle-safe).
function schemaToExample(schema, ctx, seen = new Set()) {
  if (!schema || typeof schema !== "object") return null;
  if (schema.$ref) {
    if (seen.has(schema.$ref)) return null;
    const target = lookupRef(schema.$ref, ctx.spec);
    if (!target) return null;
    const ns = new Set(seen); ns.add(schema.$ref);
    return schemaToExample(target, ctx, ns);
  }
  if (schema.example !== undefined) return schema.example;
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  if (schema.const !== undefined) return schema.const;
  if (schema.default !== undefined) return schema.default;

  if (schema.allOf) {
    const merged = {};
    for (const part of schema.allOf) {
      const ex = schemaToExample(part, ctx, seen);
      if (ex && typeof ex === "object" && !Array.isArray(ex)) Object.assign(merged, ex);
    }
    if (schema.properties) Object.assign(merged, schemaToExample({ type: "object", properties: schema.properties, required: schema.required }, ctx, seen));
    return Object.keys(merged).length ? merged : {};
  }
  if (schema.oneOf?.length) return schemaToExample(schema.oneOf[0], ctx, seen);
  if (schema.anyOf?.length) return schemaToExample(schema.anyOf[0], ctx, seen);

  const t = schema.type ?? (schema.properties ? "object" : schema.items ? "array" : undefined);

  if (t === "array") return [schemaToExample(schema.items ?? {}, ctx, seen)];
  if (t === "object" || schema.properties) {
    const obj = {};
    const props = schema.properties ?? {};
    for (const [k, v] of Object.entries(props)) {
      obj[k] = schemaToExample(v, ctx, seen);
    }
    if (schema.additionalProperties && typeof schema.additionalProperties === "object" && !Object.keys(props).length) {
      obj["key"] = schemaToExample(schema.additionalProperties, ctx, seen);
    }
    return obj;
  }
  return primitiveSample(schema);
}

function primitiveSample(s) {
  const fmt = s.format;
  if (s.type === "string") {
    if (fmt === "date-time") return "2025-01-01T00:00:00.000Z";
    if (fmt === "date") return "2025-01-01";
    if (fmt === "uuid") return "00000000-0000-0000-0000-000000000000";
    if (fmt === "email") return "user@example.com";
    if (fmt === "uri" || fmt === "url") return "https://example.com";
    if (fmt === "binary") return "<binary>";
    return "string";
  }
  if (s.type === "integer") return 0;
  if (s.type === "number") return 0;
  if (s.type === "boolean") return false;
  if (s.type === "null") return null;
  return null;
}

function typeOf(s) {
  if (!s) return "—";
  if (s.type === "array") return `${typeOf(s.items)}[]`;
  if (s.enum) return `enum(${s.enum.join("|")})`;
  return s.format ? `${s.type}<${s.format}>` : s.type ?? "object";
}
function refName(r) { return r.split("/").pop(); }
function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function oneLine(s) { return (s ?? "").replace(/\s+/g, " ").trim(); }
function cap(s) { return s[0].toUpperCase() + s.slice(1); }
function indent(s, p) { return s.split("\n").map((l) => p + l).join("\n"); }
