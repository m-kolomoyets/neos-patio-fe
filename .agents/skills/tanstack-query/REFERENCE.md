# TanStack Query — Reference

## Service Layer Architecture

Each service domain follows a consistent 4-file structure:

```
src/services/<domain>/
├── types.ts       # Request/response TypeScript types
├── api.ts         # HTTP functions using ky (http/httpPrivate)
└── queries.ts     # queryOptions/mutationOptions factories
```

### api.ts — HTTP functions

Use `http` (public) or `httpPrivate` (authenticated, auto-refreshes tokens) from `@/lib/@http`. Type request bodies with `OptionsWithTypedJson` or `OptionsWithTypedBody`:

```tsx
import type { Options } from 'ky';
import type { OptionsWithTypedJson } from '@/lib/@http';
import type { PostData, PostsData, CreatePostRequestData } from './types';
import { httpPrivate } from '@/lib/@http';

export const fetchPosts = async (options?: Options) => {
    const res = await httpPrivate.get<PostsData>('api/posts', options);
    return res.json();
};

export const fetchPost = async (id: number, options?: Options) => {
    const res = await httpPrivate.get<PostData>(`api/posts/${id}`, options);
    return res.json();
};

export const createPost = async (options: OptionsWithTypedJson<CreatePostRequestData>) => {
    const res = await httpPrivate.post<PostData>('api/posts', options);
    return res.json();
};
```

### Query Key factory

Keys are hierarchical methods (not plain properties) with `as const` for type safety. Structure from generic to specific to enable granular invalidation:

```tsx
// src/services/posts.ts
import { queryKeyFactory } from '../@queryKeyFactory';

const postsQueryKeys = queryKeyFactory('posts');

export const postsListQueryOptions = (filters?: PostFilters) => {
    return queryOptions({
        // This will generate a key like constant array ['posts', 'list', filters]
        queryKey: postsQueryKeys('list', filters),
        queryFn() {
            return fetchPosts(filters)
        },
    });
};
```

**Naming convention:**: query keys can be 2 or 3 items length. If there are no filters, the key will have 2 items. If there are filters, the key will have 3 items with the filters object as the last item.

**Filter type:** Use `Filters` from `@/lib/types` (`Record<string, string | number | boolean>`) for list query key parameters — not `Record<string, unknown>`.

**Invalidation hierarchy:**
- `postsQueryKeys()` — invalidates everything for this domain
- `postsQueryKeys('list')` — invalidates all list variants (any filters)
- `postsQueryKeys('list', { status: 'draft' })` — invalidates only this specific filter set

### queries.ts — Options factories

Always export functions that return `queryOptions()`/`mutationOptions()`. Never inline query config in components:

```tsx
import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { createPost, fetchPost, fetchPosts } from './api';
import { queryKeyFactory } from '../@queryKeyFactory';

const postsQueryKeys = queryKeyFactory('posts');

export const postsListQueryOptions = (filters?: Filters) => {
    return queryOptions({
        queryKey: postsQueryKeys('list', filters),
        queryFn() {
            return fetchPosts(filters)
        },
    });
};

export const postDetailQueryOptions = (id: number) => {
    return queryOptions({
        queryKey: postsQueryKeys('detail', id),
        queryFn() {
            return fetchPost(id)
        },
    });
};

export const createPostMutationOptions = () => {
    return mutationOptions({
        mutationKey: postsQueryKeys('create'),
        mutationFn: createPost,
        onSuccess(_data, _variables, _onMutateResult, { client }) {
            return client.invalidateQueries({
                queryKey: postsQueryKeys('list'),
            });
        },
    });
};
```

**Key rules:**
- `queryFn` must be a function reference or arrow — never a direct promise
- Include every variable `queryFn` depends on in the `queryKey`
- Access `QueryClient` via the 4th argument `{ client }` in mutation callbacks — not via import
- Return `client.invalidateQueries()` from `onSuccess` to keep mutation pending until refetch completes

---

## QueryClient Configuration

**File:** `src/lib/@queryClient.ts`

```tsx
declare module '@tanstack/react-query' {
    interface Register {
        defaultError: HTTPError<BaseErrorData>;
    }
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
            throwOnError: true,
        },
        mutations: {
            retry: false,
        },
    },
    queryCache: new QueryCache({
        async onError(error, query) {
            const hasQueryData = query.state.data !== undefined;

            if (hasQueryData && error instanceof HTTPError) {
                const parsedErrorData = await error.response.json();
                toast.error(parsedErrorData.message || error.message);
            } else if (hasQueryData && error instanceof Error) {
                toast.error(error?.message || COMMON_ERROR_MESSAGE);
            }
        },
    }),
});
```

**Design decisions:**
- `throwOnError: true` — all query errors propagate to error boundaries by default
- `retry: false` — no automatic retries (handled at HTTP level by ky if needed)
- `refetchOnWindowFocus: false` — disabled for this app
- Global `QueryCache.onError` only toasts when query already has cached data (background refetch failures)
- Error type registered globally as `HTTPError<BaseErrorData>` — all hooks get typed errors

---

## Optimistic Updates

### useOptimisticMutation hook

**File:** `src/hooks/useOptimisticMutation.ts`

A reusable hook for cache-manipulation optimistic updates with automatic rollback:

```tsx
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';

const { mutate } = useOptimisticMutation<PostData, HTTPError<BaseErrorData>, UpdatePostVars, PostsData[]>({
    mutationKey: postsKeys.updateMutationOptionsKey(),
    mutationFn: updatePost,
    queryKey: postsKeys.listQueryOptionsKey(),
    updater: (variables) => (currentData) => {
        if (!currentData) return currentData;
        return currentData.map((post) =>
            post.id === variables.id ? { ...post, ...variables } : post,
        );
    },
    invalidates: [postsKeys.listQueryOptionsKey()],
});
```

**How it works:**
1. `onMutate` — cancels in-flight queries, snapshots current cache, applies optimistic update
2. `onError` — restores snapshot (rollback)
3. `onSettled` — invalidates specified keys only when last concurrent mutation completes (`isMutating === 1` check prevents premature invalidation)

### Simple invalidation (no optimistic UI)

For mutations where immediate UI feedback isn't critical:

```tsx
export const deletePostMutationOptions = () => {
    return mutationOptions({
        mutationFn: deletePost,
        onSuccess(_data, _variables, _onMutateResult, { client }) {
            return client.invalidateQueries({
                queryKey: postsQueryKeys('list'),
            });
        },
    });
};
```

### UI-variable optimistic pattern (no cache manipulation)

For simple additions, use mutation state directly in render instead of manipulating cache:

```tsx
const createMutation = useMutation(createPostMutationOptions());

// In JSX:
{createMutation.isPending && (
    <PostItem post={createMutation.variables} style={{ opacity: 0.5 }} />
)}
```

---

## Suspense-First Approach

**Always prefer Suspense variants** — they are the default in this repo:

| Default (use this) | Fallback (only when needed) | When to fall back |
|---|---|---|
| `useSuspenseQuery` | `useQuery` | Need `enabled` or query cancellation |
| `useSuspenseQueries` | `useQueries` | Need dynamic/conditional list of queries |
| `useSuspenseInfiniteQuery` | `useInfiniteQuery` | Need `enabled` |

**Why Suspense-first:**
- `data` is always defined — no `undefined` checks, no `isPending` branches
- Loading states handled declaratively via `<Suspense>` boundaries
- Errors propagate to error boundaries (pairs with `throwOnError: true` default)
- Cleaner component code — render only the success path

**Suspense hooks do NOT support:** `enabled`, `placeholderData`, `throwOnError` override, or query cancellation. If you need any of these, use the non-Suspense variant.

### Optional: keep previous data with startTransition

If you need to keep showing previous data when a query key changes (e.g., pagination, filters), wrap the state update in `startTransition` to avoid triggering the Suspense fallback:

```tsx
import { useState, useTransition } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

function PostsList() {
    const [page, setPage] = useState(1);
    const [isPending, startTransition] = useTransition();
    const { data, isFetching } = useSuspenseQuery(postsListQueryOptions({ page }));

    const handleNextPage = () => {
        startTransition(() => {
            setPage((prev) => prev + 1);
        });
    }

    return (
        <div className={cn(isFetching && 'opacity-70')}>
            {data.map((post) => (
                <PostItem key={post.id} post={post} />
            ))}
            <Button onClick={handleNextPage} disabled={isPending}>
                Next
            </Button>
        </div>
    );
}
```

**How it works:** `startTransition` marks the state update as non-urgent. React keeps rendering the old UI (with previous query data) while the new query fetches in the background.

**`isFetching` vs `isPending`:** `isFetching` (from the query) is `true` whenever a network request is in flight, including background refetches. `isPending` (from `useTransition`) is `true` only while React defers a transition state update. Use `isFetching` for visual feedback (it catches all fetch states), and `isPending` for disabling interaction during transitions.

### Multiple parallel queries

Use `useSuspenseQueries` instead of multiple `useSuspenseQuery` calls to avoid request waterfalls:

```tsx
const [posts, categories] = useSuspenseQueries({
    queries: [
        postsListQueryOptions(filters),
        categoriesListQueryOptions(),
    ],
});
```

Each `useSuspenseQuery` call creates its own Suspense boundary trigger — sequential calls can waterfall. `useSuspenseQueries` fetches all in parallel.

---

## TanStack Router Integration

### Blocking loader (Suspense query — default)

Use `ensureQueryData` in loader + `useSuspenseQuery` in component. Data is guaranteed before render:

```tsx
// Route file
export const Route = createFileRoute('/_authenticated/posts/')({
    loader: ({ context: { queryClient } }) => {
        return queryClient.ensureQueryData(postsListQueryOptions());
    },
    component: PostsModule,
});

// Module — data always defined, no undefined checks
function PostsModule() {
    const { data } = useSuspenseQuery(postsListQueryOptions());
    return <PostsList posts={data} />;
}
```

### Non-blocking loader (prefetch — exception case)

Use only when you intentionally want the route to render before data arrives. Pair `prefetchQuery` (fire-and-forget) with `useQuery` since `useSuspenseQuery` would block rendering:

```tsx
export const Route = createFileRoute('/_authenticated/dashboard/')({
    loader: ({ context: { queryClient } }) => {
        queryClient.prefetchQuery(statsQueryOptions());
    },
    component: DashboardModule,
});

function DashboardModule() {
    const { data, isLoading } = useQuery(statsQueryOptions());
    if (isLoading) return <Skeleton />;
    return <Stats data={data} />;
}
```

### Mixed blocking + non-blocking

```tsx
async loader({ context: { queryClient } }) {
    await queryClient.ensureQueryData(postDetailQueryOptions(id));
    queryClient.prefetchQuery(postCommentsQueryOptions(id));
},
```

### Loader with search params (loaderDeps)

Never access search params directly in loaders. Use `loaderDeps`:

```tsx
export const Route = createFileRoute('/_authenticated/posts/')({
    validateSearch: z.object({
        page: z.number().int().positive().catch(1),
        status: z.enum(['all', 'draft', 'published']).catch('all'),
    }),
    loaderDeps: ({ search }) => {
        return search;
    },
    loader: ({ deps, context: { queryClient } }) => {
        return queryClient.ensureQueryData(postsListQueryOptions(deps));
    },
    component: PostsModule,
});
```

---

## Error Handling

### Three-layer strategy

1. **Error boundaries (default)** — `throwOnError: true` propagates errors to nearest boundary. `ErrorComponent` uses `useQueryErrorResetBoundary()` for retry:

```tsx
// src/components/ErrorComponent/index.tsx
const queryErrorResetBoundary = useQueryErrorResetBoundary();
useEffect(() => {
    queryErrorResetBoundary.reset();
}, [queryErrorResetBoundary]);
```

2. **Global toasts** — `QueryCache.onError` shows toast only for background refetch failures (query already has cached data)

3. **Form-level** — mutation `onError` callbacks set errors on form fields or show toasts:

```tsx
const { mutateAsync: login } = useMutation(loginMutationOptions());
await login(
    { json: value },
    {
        onError(error) {
            if (isHTTPError(error) && typeof error.data === 'object') {
                formApi.setErrorMap({
                    onSubmit: {
                        fields: {
                            username: { message: error.data.message },
                            password: { message: error.data.message },
                        },
                    },
                });
            } else {
                toast.error(error.message);
            }
        },
    },
);
```

### Conditional error propagation (non-Suspense fallback)

Only when you need local error handling instead of boundary propagation — requires `useQuery` since `useSuspenseQuery` doesn't support `throwOnError`:

```tsx
const { data, error } = useQuery({
    ...postsListQueryOptions(),
    throwOnError: false,
});
```

---

## Dependent & Parallel Queries

### Parallel (default) — useSuspenseQueries

Always prefer `useSuspenseQueries` for multiple independent queries:

```tsx
const [user, settings] = useSuspenseQueries({
    queries: [
        userQueryOptions(userId),
        settingsQueryOptions(userId),
    ],
});
```

### Sequential dependent — useSuspenseQuery in series

When query B depends on query A's result, use sequential `useSuspenseQuery` calls. Data is always defined so no `enabled` needed:

```tsx
const { data: user } = useSuspenseQuery(userQueryOptions(userId));
const { data: posts } = useSuspenseQuery(userPostsQueryOptions(user.organizationId));
```

### Sequential with `enabled` (fallback — useQuery)

Only when the dependency may not exist (e.g., optional relationship):

```tsx
const { data: user } = useSuspenseQuery(userQueryOptions(userId));

const { data: posts } = useQuery({
    ...userPostsQueryOptions(user?.teamId),
    enabled: !!user?.teamId,
});
```

### Dynamic list — useQueries / useSuspenseQueries

```tsx
// When ids are guaranteed (Suspense)
const results = useSuspenseQueries({
    queries: ids.map((id) => postDetailQueryOptions(id)),
});

// When ids may be empty or conditional (non-Suspense fallback)
const results = useQueries({
    queries: ids?.map((id) => postDetailQueryOptions(id)) ?? [],
});
```

---

## Infinite Queries

```tsx
import { infiniteQueryOptions } from '@tanstack/react-query';

export const postsInfiniteQueryOptions = (filters?: PostFilters) => {
    return infiniteQueryOptions({
        queryKey: postsKeys.listQueryOptionsKey({ ...filters, infinite: true }),
        queryFn: ({ pageParam }) => fetchPosts({ ...filters, cursor: pageParam }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        maxPages: 10,
    });
};

// Component
function PostsFeed() {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useSuspenseInfiniteQuery(postsInfiniteQueryOptions());

    return (
        <>
            {data.pages.flatMap((page) => page.items).map((post) => (
                <PostItem key={post.id} post={post} />
            ))}
            <Button
                onClick={() => fetchNextPage()}
                disabled={!hasNextPage || isFetchingNextPage}
            >
                {isFetchingNextPage ? 'Loading...' : hasNextPage ? 'Load more' : 'No more'}
            </Button>
        </>
    );
}
```

**Key rules:**
- `initialPageParam` is required in v5
- Use `maxPages` to cap memory for long scroll sessions
- Don't call `fetchNextPage()` while `isFetchingNextPage` is true

---

## Data Transformations

Prefer `select` for transforming query data — it's memoized and only runs when data changes:

```tsx
const { data: postTitles } = useSuspenseQuery({
    ...postsListQueryOptions(),
    select: (data) => data.map((post) => post.title),
});
```

Components using `select` only re-render when the selected slice changes (structural sharing).

**Don't** transform in `queryFn` — it runs on every fetch with no memoization.

---

## Cache Invalidation Strategies

```tsx
// Invalidate entire domain
client.invalidateQueries({ queryKey: postsKeys.all() });

// Invalidate all lists (any filter combination)
client.invalidateQueries({ queryKey: postsKeys.listQueryOptionsKey() });

// Invalidate specific filter
client.invalidateQueries({ queryKey: postsKeys.listQueryOptionsKey({ status: 'draft' }) });

// Exact match only
client.invalidateQueries({ queryKey: postsKeys.detailQueryOptionsKey(5), exact: true });

// Set cache directly from mutation response + invalidate lists
onSuccess(newPost, _variables, _onMutateResult, { client }) {
    client.setQueryData(postsKeys.detailQueryOptionsKey(newPost.id), newPost);
    return client.invalidateQueries({ queryKey: postsKeys.listQueryOptionsKey() });
},

// Clear everything (e.g., on logout)
client.clear();
```

---

## ESLint Rules

This repo uses `@tanstack/eslint-plugin-query` with `flat/recommended-strict`. Key enforced rules:

- **exhaustive-deps** — query keys must include all variables used in `queryFn`
- **no-rest-destructuring** — prevents `const { ...rest } = useQuery()` (breaks tracked queries optimization)
- **stable-query-client** — `QueryClient` must be created outside components or in state/ref
- **no-unstable-deps** — deps in `queryKey` must be stable references
- **infinite-query-property-order** — enforces consistent property ordering

All rules are errors (strict mode). Run `npm run lint:eslint` to verify.

---

## TypeScript Patterns

### Let inference work — don't add explicit generics to hooks

```tsx
// Good — types flow from queryOptions
const { data } = useSuspenseQuery(postsListQueryOptions());

// Bad — redundant generics
const { data } = useSuspenseQuery<PostsData>(postsListQueryOptions());
```

### Type API functions, not hooks

```tsx
// api.ts — type the function
export const fetchPosts = async (options?: Options) => {
    const res = await httpPrivate.get<PostsData>('api/posts', options);
    return res.json();
};

// queries.ts — types propagate through queryOptions
export const postsListQueryOptions = () => {
    return queryOptions({
        queryKey: postsKeys.listQueryOptionsKey(),
        queryFn: fetchPosts,
    });
};
```

### Registered error type

The global error type `HTTPError<BaseErrorData>` is registered in `src/lib/@queryClient.ts`. All hooks automatically receive typed errors — no need to specify `TError` generics.