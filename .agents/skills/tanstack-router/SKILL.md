---
name: tanstack-router
description: TanStack Router patterns for this repo — file-based routing, auth guards, search params, data loading, TanStack Query integration, navigation, and code splitting. Use when creating routes, adding pages, implementing auth flows, working with search/path params, or integrating loaders with TanStack Query.
user-invocable: false
---

# TanStack Router

## Quick start

This repo uses **file-based routing** with `@tanstack/router-plugin/vite` and `autoCodeSplitting: true`. Routes live in `src/routes/`. The generated route tree (`src/routeTree.gen.ts`) is never edited manually.

### Creating a new page

1. Create `src/routes/_authenticated/<page-name>/index.tsx`
2. Use `createFileRoute` — the plugin infers the path
3. Add navigation link in sidebar constants if needed

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { MyPage } from '@/modules/MyPage';

export const Route = createFileRoute('/_authenticated/my-page/')({
  component: MyPage,
});
```

## Workflows

### Adding an authenticated route

- [ ] Create route file under `src/routes/_authenticated/`
- [ ] Add `beforeLoad` with permission check if route is restricted
- [ ] Add loader if data is needed before render
- [ ] Add sidebar navigation entry in `SidebarNavigation/constants.ts`
- [ ] Run `npm run dev:vite` to regenerate route tree

### Adding search params to a route

- [ ] Define Zod schema with `.catch()` fallbacks (not `.default()`)
- [ ] Attach via `validateSearch`
- [ ] Use `loaderDeps` if loader needs search params
- [ ] Access in component via `Route.useSearch()`
- [ ] See [REFERENCE.md](REFERENCE.md) § Search Params

### Adding route with data loading (TanStack Query)

- [ ] Define query options in `src/services/<domain>/queries.ts`
- [ ] Use `ensureQueryData` in loader for blocking data
- [ ] Use `prefetchQuery` for non-blocking data
- [ ] Consume with `useSuspenseQuery` (blocking) or `useQuery` (non-blocking)
- [ ] See [REFERENCE.md](REFERENCE.md) § TanStack Query Integration

## Key conventions

| Pattern | This repo's approach |
|---|---|
| Auth guard | `_authenticated/route.tsx` — `beforeLoad` checks `getAuthToken()` + `ensureQueryData(meQueryOptions())`, redirects to `/login` |
| Public routes | `_public/route.tsx` — `beforeLoad` optionally resolves auth (no redirect, works for both logged-in and anonymous users) |
| Permission guard | `beforeLoad` calls `checkIsRouteAllowed(key, auth.me.role)`, throws `notFound()` |
| Layouts | Pathless `_` prefix dirs (`_authenticated/`, `_unauthenticated/`, `_public/`) with `<Outlet />` |
| Code splitting | Automatic via Vite plugin — no manual lazy imports needed for routes |
| Search params | Zod validation with `.catch()`, accessed via `Route.useSearch()` or `getRouteApi()` |
| Navigation | `<Link>` with `activeProps` for styling; `useNavigate()` for programmatic nav |
| Router context | `queryClient` + `auth` (discriminated union `AuthContext`) passed via `createRootRouteWithContext` |
| Router config | `src/lib/@router.tsx` — `Wrap` (no router hooks) and `InnerWrap` (router hooks available) for providers |
| Preloading | `defaultPreload: 'intent'` — prefetches on hover/focus |
| Error/404 | Global defaults set on router; per-route overrides as needed |

## Advanced features

See [REFERENCE.md](REFERENCE.md) for detailed patterns:

- Route guards & permission system
- Search params with Zod validation
- TanStack Query integration (blocking, non-blocking, mixed)
- Navigation patterns (Link, useNavigate, getRouteApi)
- Not-found handling
- Code splitting details
- Router configuration options