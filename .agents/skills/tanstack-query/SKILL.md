---
name: tanstack-query
description: TanStack Query patterns for this repo — queryOptions/mutationOptions factories, query key hierarchies, service layer integration, optimistic updates, Suspense usage, error handling, and TanStack Router data loading. Use when creating queries, mutations, API services, query keys, cache invalidation, optimistic updates, or integrating data fetching with routes.
user-invocable: false
---

# TanStack Query

## Quick start

This repo uses **TanStack Query v5** with strict ESLint rules (`flat/recommended-strict`). Data fetching is organized per service domain in `src/services/<domain>/`.

### Adding a new query

1. Create or extend `src/services/<domain>/queries.ts` — `queryOptions`/`mutationOptions` factories
2. Create the queryKeys factory, using `queryKeyFactory` utility. If this does not exist in project, create it in `src/services/@queryKeyFactory.ts` (see [Link](https://gist.github.com/m-kolomoyets/5b2fd14ee2aab46d4ff5627a8b003130)).
3. Create or extend `src/services/<domain>/api.ts` — typed API functions using `http`/`httpPrivate`
4. Consume in components via `useSuspenseQuery` (default) — fall back to `useQuery` only when `enabled` is needed; if you need to keep previous data during key changes, use `startTransition` (see [REFERENCE.md](REFERENCE.md) § Suspense-First Approach)

```tsx
// queries.ts
import { queryOptions } from '@tanstack/react-query';
import { fetchPosts } from './api';
import { queryKeyFactory } from '../@queryKeyFactory';

const postsQueryKeys = queryKeyFactory('posts');

export const postsListQueryOptions = (filters?: PostFilters) => {
    return queryOptions({
        queryKey: postsQueryKeys('list', filters),
        queryFn() {
            return fetchPosts(filters)
        },
    });
};
```

## Workflows

### Adding a new service domain

- [ ] Create `src/services/<domain>/types.ts` — request/response types
- [ ] Create `src/services/<domain>/api.ts` — API functions
- [ ] Create `src/services/<domain>/queries.ts` — query/mutation options
- [ ] Wire into route loader or component

### Adding a mutation with cache invalidation

- [ ] Create `mutationOptions()` factory in `queries.ts`
- [ ] Handle `onSuccess` — invalidate or update related queries via `{ client }` context arg
- [ ] Consume with `useMutation` in component

### Adding optimistic updates

- [ ] Use `useOptimisticMutation` hook from `src/hooks/useOptimisticMutation.ts`
- [ ] Provide `queryKey`, `updater`, and `invalidates` array
- [ ] See [REFERENCE.md](REFERENCE.md) § Optimistic Updates

## Key conventions

| Pattern | This repo's approach |
|---|---|
| Query options | Always use `queryOptions()`/`mutationOptions()` factories — never inline config |
| Query keys | Hierarchical factory per domain with `as const`; methods, not plain properties |
| API functions | Typed wrappers around `http`/`httpPrivate` (ky) in `api.ts` |
| Query hooks | **Suspense-first**: prefer `useSuspenseQuery`/`useSuspenseQueries`/`useSuspenseInfiniteQuery`; only fall back to `useQuery`/`useQueries` when `enabled` is required |
| Error handling | Global `QueryCache.onError` for toasts; `throwOnError: true` for boundaries |
| Error type | Registered globally as `HTTPError<BaseErrorData>` |
| Data transforms | Use `select` option, not inline transforms in `queryFn` |
| Mutations context | Access `client` (QueryClient) via 4th arg in callbacks: `onSuccess(data, vars, onMutateResult, { client })` |
| Import order | Follow Prettier import sorting — types first, then `@tanstack`, then local |

## Advanced features

See [REFERENCE.md](REFERENCE.md) for detailed patterns:

- Service layer architecture (api, queryKeys, queries)
- Query key factory design
- QueryClient configuration and error registration
- Optimistic mutations (useOptimisticMutation hook)
- TanStack Router integration (loaders, prefetching, loaderDeps)
- Error handling strategies
- Dependent and parallel queries
- Infinite queries
- Data transformations with `select`
- Cache invalidation strategies