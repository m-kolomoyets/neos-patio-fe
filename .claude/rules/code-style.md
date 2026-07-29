---
paths:
  - "src/**/*.{ts,tsx}"
---

# Code Style & Conventions

Quick reference distilled from repo configs. Deep dives: `.claude/skills/{typescript,react,accessible-html-jsx,tanstack-query,tanstack-router,tanstack-form,web-security}/SKILL.md`.

## Formatting

- 4-space indent, LF, final newline, 120-col lines, semicolons, trailing commas `es5`, `arrowParens: always`.
- Single quotes in JS/TS/TSX; double quotes in CSS/HTML/SVG (`prettier.config.js` override).
- Imports auto-sorted (`@ianvs/prettier-plugin-sort-imports`): type imports → `react`/`react-dom` → builtins → third-party → `@/lib` → `@/lib/{constants,schemas,regexps,utils}` → `@/hooks|@/context` → `@/services` → `@/modules` → `@/components` → `@/components/layouts` → `@/components/ui` → relative (same hierarchy) → bare relative → `.css`. Don't hand-order — `pnpm fix:prettier`.

## TypeScript

- `strict` + `noUnusedLocals/Parameters` + `erasableSyntaxOnly` + `verbatimModuleSyntax` (`tsconfig.app.json`/`tsconfig.node.json`).
- `erasableSyntaxOnly` → no `enum`, no parameter properties; use union types / `as const` objects.
- `import type { X }` for type-only imports (`verbatimModuleSyntax` + `consistent-type-imports`/`no-import-type-side-effects` enforce).
- Alias `@/*` → `src/*`. Prefix intentionally-unused vars/args/caught-errors with `_`.
- Prefer `type` aliases; avoid `any`/unsafe assertions; use `!` sparingly (lint allows it — don't lean on it).

## ESLint gotchas

- `arrow-body-style: always` — block bodies, never implicit returns. `if` always with braces: `if (...) { return; }`, never single-line `if (...) return;`.
- `useEffect`/`useLayoutEffect`/`useImperativeHandle` callbacks must be **named functions**, not arrows (`no-restricted-syntax`).
- `forwardRef` banned — `ref` is a prop in React 19 (`no-restricted-syntax`).
- `eqeqeq`, `no-nested-ternary`, `no-unneeded-ternary`, `require-await`, `no-alert`, `no-debugger`, `no-var`; `no-console` warns.
- TanStack Query plugin `recommended-strict`; Router `recommended` (`create-route-property-order` warns); `react-hooks` recommended, never disabled.
- Generated — never edit: `src/routeTree.gen.ts`, `public/mockServiceWorker.js`.

## React (19 + Compiler)

- Named components as **function declarations** (`function Foo() {}`) with named exports — enforced by `react/function-component-definition`; no default exports, no arrow-function components.
- Compound/composition API for new components (e.g. `Sheet` + `SheetTrigger` + `SheetContent`); canonical: `src/components/ui/Sheet/`, `src/components/ui/DropdownMenu/` (Base UI primitives).
- No `forwardRef` (`ref` is a prop); no new `useMemo`/`useCallback`/`memo()` — Compiler handles it (exception: non-render referential stability, comment why).
- Derive during render; no prop-mirroring state; `useEffect` only for external-system sync; data via TanStack Query, never `fetch` in effects.
- Named handlers (`handleClick`) for non-trivial logic; self-closing tags (`self-closing-comp`); no useless fragments (`jsx-no-useless-fragment`); stable keys (never index if reorderable).
- One hook per file; contexts via `useSafeContext` + `displayName`.

## Styling (CSS Modules)

## A11y

- `jsx-a11y` enforced; `label-has-associated-control` configured with `labelComponents: Label, FieldLabel`, `controlComponents: Input, PasswordInput`, `labelAttributes: ['label']`, `depth: 3` (see `eslint.config.js`).
- Semantic HTML first; Base UI primitives live in `src/components/ui`.

## Structure & data flow

- Layers: `src/components/ui` (Base UI primitives or other dumb components) → `src/components` (composites, little logic) → `src/modules` (page-level features) → `src/routes` (TanStack Router file-based, wiring). No `src/ui`/`src/pages`.
- Shared code: `src/lib` (`@http`, `@queryClient`, `@router`, `constants.ts`, `schemas.ts`, `regexps.ts`, `types.ts`, `utils/`), `src/hooks`, `src/context`, `src/mocks` (MSW), `src/styles`.
- Data: `src/services/<domain>/` — `api.ts` (ky) → `queries.ts` (`queryOptions`/`mutationOptions` factories) + `queryKeys.ts` (key factory) + `types.ts`. Routes preload via loader `ensureQueryData(factory())`; components read via `useSuspenseQuery(factory())`.
- Component/module dirs: `index.tsx` (or `index.ts` barrel), optional `types.ts`, `constants.ts`, `schemas.ts` (Zod), `utils/variants.ts`, `hooks/`, `context/`, nested `components/`. No `store.ts` (no global store layer).
- Forms: `src/components/Form` exposes `useAppForm`/`withForm` (TanStack Form + Zod); build fields with `form.AppField` + `field.FormFieldWrapper`. See `tanstack-form` skill.
- Routing: Zod `validateSearch` with `.catch()`; `beforeLoad` guards (auth token + permission checks).
- Update `src/vite-env.d.ts` when adding env vars.

## Tooling

- **pnpm only**, via scripts: `pnpm tsc`, `pnpm lint` (eslint + stylelint + prettier), `pnpm fix:prettier`, `pnpm knip`. No test runner configured (no unit/e2e).
- Husky: `pre-push` runs `pnpm tsc` → `pnpm lint` → `pnpm build`; `commit-msg` runs `commitlint`.
- Commits: Conventional Commits (`build|ci|docs|feat|fix|perf|refactor|revert|style|test`), lower-case type/scope, header ≤ 100 chars.
