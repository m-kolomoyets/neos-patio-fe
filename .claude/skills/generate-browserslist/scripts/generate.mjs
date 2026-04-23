#!/usr/bin/env node
// Generate a browserslist config as the intersection of all main dependencies'
// declared browserslists, and optionally sync the result into vite.config.*.
//
// Usage:
//   node generate.mjs [--write] [--include-dev] [--no-vite]
//                     [--baseline "<query>"] [--only pkg,pkg] [--json]
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

const VITE_MAP = {
    chrome: 'chrome',
    edge: 'edge',
    firefox: 'firefox',
    ie: 'ie',
    safari: 'safari',
    ios_saf: 'ios',
    opera: 'opera',
};

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();

let browserslist;
try {
    browserslist = require('browserslist');
} catch {
    fail(
        "The `browserslist` package is required. Install it in the project (it's a transitive dep of most build tools, or run `npm i -D browserslist`).",
        2
    );
}

const pkgPath = path.join(cwd, 'package.json');
if (!fs.existsSync(pkgPath)) fail(`No package.json at ${pkgPath}`, 2);
const pkg = readJson(pkgPath);

const depNames = collectDepNames(pkg, {
    includeDev: args['include-dev'],
    only: args.only ? args.only.split(',').map((s) => s.trim()) : null,
});

const baselineQuery = args.baseline || 'defaults';
const baseline = safeResolve(baselineQuery, cwd);
if (!baseline) fail(`Baseline query "${baselineQuery}" resolved to no browsers.`, 2);

const report = {
    baseline: baselineQuery,
    projectRoot: cwd,
    deps: {},
    skipped: [],
    intersection: [],
    browserslist: [],
    viteTarget: [],
};

let intersection = new Set(baseline);

for (const name of depNames) {
    const depInfo = readDepBrowserslist(name, cwd);
    if (!depInfo) {
        report.skipped.push(name);
        continue;
    }
    const resolved = safeResolve(depInfo.query, depInfo.dir);
    if (!resolved) {
        report.skipped.push(name);
        continue;
    }
    report.deps[name] = { query: depInfo.query, browsers: resolved };
    intersection = intersectSets(intersection, new Set(resolved));
}

report.intersection = [...intersection].sort();

if (intersection.size === 0) {
    if (args.json) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    else {
        console.error('\n✘ Intersection is empty — no common browser supported by all deps.');
        console.error('  Review per-dep sets with --json to identify the tightest constraint.');
    }
    process.exit(1);
}

report.browserslist = collapseToRanges(report.intersection);
report.viteTarget = toViteTarget(report.intersection);

if (args.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} else {
    printHumanReport(report);
}

if (args.write) {
    writePackageBrowserslist(pkgPath, pkg, report.browserslist);
    console.log(`\n✔ Wrote browserslist to ${path.relative(cwd, pkgPath)}`);

    if (!args['no-vite']) {
        const viteUpdated = updateViteConfig(cwd, report.viteTarget);
        if (viteUpdated) console.log(`✔ Updated build.target in ${path.relative(cwd, viteUpdated)}`);
        else console.log('ℹ No vite.config.* found — skipped.');
    }
}

// ---------- helpers ----------

function parseArgs(argv) {
    const out = {};
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (!a.startsWith('--')) continue;
        const key = a.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
            out[key] = next;
            i++;
        } else {
            out[key] = true;
        }
    }
    return out;
}

function readJson(p) {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function collectDepNames(pkg, { includeDev, only }) {
    const set = new Set([...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})]);
    if (includeDev) {
        for (const k of Object.keys(pkg.devDependencies || {})) set.add(k);
    }
    let names = [...set];
    if (only) names = names.filter((n) => only.includes(n));
    return names.sort();
}

function readDepBrowserslist(name, root) {
    let depPkgPath;
    try {
        depPkgPath = require.resolve(`${name}/package.json`, { paths: [root] });
    } catch {
        return null;
    }
    const dir = path.dirname(depPkgPath);
    const depPkg = readJson(depPkgPath);
    if (depPkg.browserslist) {
        const q = Array.isArray(depPkg.browserslist)
            ? depPkg.browserslist
            : typeof depPkg.browserslist === 'string'
              ? [depPkg.browserslist]
              : depPkg.browserslist.production || null;
        if (q) return { query: q, dir };
    }
    const rcPath = path.join(dir, '.browserslistrc');
    if (fs.existsSync(rcPath)) {
        const lines = fs
            .readFileSync(rcPath, 'utf8')
            .split('\n')
            .map((l) => l.replace(/#.*$/, '').trim())
            .filter(Boolean)
            .filter((l) => !l.startsWith('['));
        if (lines.length) return { query: lines, dir };
    }
    return null;
}

function safeResolve(query, dir) {
    try {
        return browserslist(query, { path: dir });
    } catch {
        return null;
    }
}

function intersectSets(a, b) {
    const out = new Set();
    for (const x of a) if (b.has(x)) out.add(x);
    return out;
}

function collapseToRanges(entries) {
    const lowest = new Map();
    for (const e of entries) {
        const [browser, version] = splitEntry(e);
        if (!browser) continue;
        const cur = lowest.get(browser);
        if (!cur || cmpVersion(version, cur) < 0) lowest.set(browser, version);
    }
    return [...lowest.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([b, v]) => `${b} >= ${v}`);
}

function splitEntry(entry) {
    // "chrome 111", "safari 16.4", "ios_saf 16.4-16.6"
    const [browser, verRange] = entry.split(' ');
    if (!verRange) return [null, null];
    const version = verRange.split('-')[0];
    return [browser, version];
}

function cmpVersion(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const d = (pa[i] || 0) - (pb[i] || 0);
        if (d !== 0) return d;
    }
    return 0;
}

function toViteTarget(entries) {
    const lowest = new Map();
    for (const e of entries) {
        const [browser, version] = splitEntry(e);
        const prefix = VITE_MAP[browser];
        if (!prefix) continue;
        const cur = lowest.get(prefix);
        if (!cur || cmpVersion(version, cur) < 0) lowest.set(prefix, version);
    }
    return [...lowest.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([p, v]) => `${p}${v}`);
}

function writePackageBrowserslist(p, pkg, list) {
    pkg.browserslist = list;
    fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
}

function updateViteConfig(root, target) {
    const candidates = ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs'];
    const found = candidates.map((f) => path.join(root, f)).find(fs.existsSync);
    if (!found) return null;

    let parser, generator, t;
    try {
        parser = require('@babel/parser');
        generator = require('@babel/generator').default;
        t = require('@babel/types');
    } catch {
        fail(
            'To sync vite.config, install dev deps: @babel/parser, @babel/generator, @babel/types. Or pass --no-vite.',
            2
        );
    }

    const src = fs.readFileSync(found, 'utf8');
    const ast = parser.parse(src, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
    });

    const targetArray = t.arrayExpression(target.map((s) => t.stringLiteral(s)));
    const configObj = findConfigObject(ast, t);
    if (!configObj) fail(`Could not locate config object in ${found}.`, 2);

    upsertProperty(configObj, 'build', t.objectExpression([]), t);
    const buildProp = configObj.properties.find((p) => p.key && (p.key.name === 'build' || p.key.value === 'build'));
    if (!t.isObjectExpression(buildProp.value)) {
        fail(`build in ${found} is not a plain object literal — refusing to edit.`, 2);
    }
    upsertProperty(buildProp.value, 'target', targetArray, t, { replace: true });

    const { code } = generator(ast, { retainLines: false, jsescOption: { minimal: true } }, src);
    fs.writeFileSync(found, code.endsWith('\n') ? code : code + '\n');
    return found;
}

function findConfigObject(ast, t) {
    let obj = null;
    for (const node of ast.program.body) {
        if (t.isExportDefaultDeclaration(node)) {
            const d = node.declaration;
            if (t.isObjectExpression(d)) {
                obj = d;
                break;
            }
            if (t.isCallExpression(d) && t.isObjectExpression(d.arguments[0])) {
                // defineConfig({...})
                obj = d.arguments[0];
                break;
            }
            if (t.isArrowFunctionExpression(d) || t.isFunctionExpression(d)) {
                // defineConfig(({mode}) => ({...})) or () => defineConfig({...})
                const body = t.isBlockStatement(d.body)
                    ? findReturnedObject(d.body, t)
                    : t.isObjectExpression(d.body)
                      ? d.body
                      : t.isCallExpression(d.body) && t.isObjectExpression(d.body.arguments[0])
                        ? d.body.arguments[0]
                        : null;
                if (body) obj = body;
                break;
            }
        }
    }
    return obj;
}

function findReturnedObject(block, t) {
    for (const stmt of block.body) {
        if (t.isReturnStatement(stmt) && stmt.argument) {
            if (t.isObjectExpression(stmt.argument)) return stmt.argument;
            if (t.isCallExpression(stmt.argument) && t.isObjectExpression(stmt.argument.arguments[0]))
                return stmt.argument.arguments[0];
        }
    }
    return null;
}

function upsertProperty(objExpr, name, defaultValue, t, opts = {}) {
    const existing = objExpr.properties.find((p) => p.key && (p.key.name === name || p.key.value === name));
    if (existing) {
        if (opts.replace) existing.value = defaultValue;
        return existing;
    }
    const prop = t.objectProperty(t.identifier(name), defaultValue);
    objExpr.properties.push(prop);
    return prop;
}

function printHumanReport(r) {
    console.log(`Baseline: ${r.baseline}`);
    console.log(`\nConstraining dependencies (${Object.keys(r.deps).length}):`);
    for (const [name, d] of Object.entries(r.deps)) {
        console.log(`  • ${name}: ${Array.isArray(d.query) ? d.query.join(', ') : d.query}`);
    }
    if (r.skipped.length) {
        console.log(`\nSkipped (no browserslist declared): ${r.skipped.length} deps`);
    }
    console.log(`\nProposed browserslist:`);
    for (const b of r.browserslist) console.log(`  ${b}`);
    console.log(`\nProposed Vite build.target:`);
    console.log(`  [${r.viteTarget.map((s) => `"${s}"`).join(', ')}]`);
    console.log(`\n(Run with --write to persist these changes.)`);
}

function fail(msg, code = 1) {
    console.error(`✘ ${msg}`);
    process.exit(code);
}
