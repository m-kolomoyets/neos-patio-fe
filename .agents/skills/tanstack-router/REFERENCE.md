# TanStack Router — Reference

## File-Based Routing Structure

```
src/routes/
├── __root.tsx                    # Root layout (providers, devtools, Outlet)
├── index.tsx                     # Home page (/)
├── _authenticated/
│   ├── route.tsx                 # Auth guard layout
│   ├── dashboard/index.tsx       # /dashboard
│   ├── merchants/index.tsx       # /merchants (permission-gated)
│   └── vouchers/index.tsx        # /vouchers (permission-gated)
├── _public/
│   ├── route.tsx                 # Public layout (works for both auth & anon)
│   └── index.tsx                 # / (home)
└── _unauthenticated/
    ├── route.tsx                 # Guest-only layout (redirects if logged in)
    └── login/index.tsx           # /login
```

### File naming conventions

| File/Pattern | Purpose |
|---|---|
| `__root.tsx` | Root layout — always at routes root |
| `index.tsx` | Exact match for parent path |
| `_prefix/` | Pathless layout — no URL segment contributed |
| `$paramName.tsx` | Dynamic path segment |
| `$.tsx` | Catch-all / splat route |
| `(folder)/` | Route group — organizational only, no URL |
| `-folder/` | Excluded from route generation (colocated files) |

---

## Route Guards & Authentication

### Auth guard (pathless layout)

Uses `getAuthToken()` as a fast synchronous gate, then `ensureQueryData(meQueryOptions())` to server-validate and populate user data in route context. On success, returns a discriminated `AuthenticatedState` for child routes. On failure, clears tokens and redirects.

```tsx
// src/routes/_authenticated/route.tsx
import type { AuthenticatedState } from '@/services/authExample/types';
import { createFileRoute, isRedirect, redirect } from '@tanstack/react-router';
import { getAuthToken, removeAuthToken, removeRefreshToken } from '@/lib/utils/auth/tokens';
import { meQueryOptions } from '@/services/authExample/queries';
import { MainLayout } from '@/components/layouts/MainLayout';

export const Route = createFileRoute('/_authenticated')({
    async beforeLoad({ context: { queryClient }, location }) {
        const unauthRedirectOptions = {
            to: '/login',
            search: { redirect: location.href },
            replace: true,
        } as const;

        if (!getAuthToken()) {
            throw redirect(unauthRedirectOptions);
        }

        try {
            const me = await queryClient.ensureQueryData(meQueryOptions());

            return { auth: { isAuthenticated: true, me } satisfies AuthenticatedState };
        } catch (error) {
            if (isRedirect(error)) {
                throw error;
            }

            removeAuthToken();
            removeRefreshToken();
            throw redirect(unauthRedirectOptions);
        }
    },
    component: MainLayout,
});
```

### Permission guard (per-route)

Child routes of `_authenticated` receive `auth` with `AuthenticatedState` (user is guaranteed). Pass `auth.me.role` to `checkIsRouteAllowed`:

```tsx
// src/routes/_authenticated/merchants/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { checkIsRouteAllowed } from '@/lib/utils/auth/permissions';
import { Merchants } from '@/modules/Merchants';

export const Route = createFileRoute('/_authenticated/merchants/')({
    beforeLoad({ context: { auth } }) {
        checkIsRouteAllowed('merchants.view', auth.me.role);
    },
    component: Merchants,
});
```

### Guest-only guard (unauthenticated layout)

```tsx
// src/routes/_unauthenticated/route.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { FALLBACK_REDIRECT } from '@/lib/constants';
import { getAuthToken } from '@/lib/utils/auth/tokens';

export const Route = createFileRoute('/_unauthenticated')({
    validateSearch: z.object({
        redirect: z.string().optional().catch(''),
    }),
    beforeLoad({ search }) {
        if (getAuthToken()) {
            throw redirect({
                to: search.redirect || FALLBACK_REDIRECT,
                replace: true,
            });
        }
    },
    component: Outlet,
});
```

### Public routes (accessible by both authenticated and anonymous users)

No redirects — `beforeLoad` optionally resolves auth state. If a token exists, validates with `ensureQueryData`; otherwise returns unauthenticated state. Child components can check `auth.isAuthenticated` to show different UI.

```tsx
// src/routes/_public/route.tsx
import type { AuthenticatedState, UnauthenticatedState } from '@/services/authExample/types';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { getAuthToken } from '@/lib/utils/auth/tokens';
import { meQueryOptions } from '@/services/authExample/queries';

export const Route = createFileRoute('/_public')({
    async beforeLoad({ context: { queryClient } }) {
        if (!getAuthToken()) {
            return {
                auth: {
                    me: null,
                    isAuthenticated: false,
                } satisfies UnauthenticatedState,
            };
        }

        try {
            const me = await queryClient.ensureQueryData(meQueryOptions());
            return {
                auth: { me, isAuthenticated: true } satisfies AuthenticatedState,
            };
        } catch {
            return {
                auth: { me: null, isAuthenticated: false } satisfies UnauthenticatedState,
            };
        }
    },
    component: Outlet,
});
```

### Auth context type (discriminated union)

```tsx
// src/services/authExample/types.ts
type AuthenticatedState = { isAuthenticated: true; me: MeData };
type UnauthenticatedState = { isAuthenticated: false; me: null };
type AuthContext = AuthenticatedState | UnauthenticatedState;
```

### Key rules for beforeLoad

- Runs top-down: root -> parent -> child
- Throw `redirect()` to guard; throw `notFound()` for missing resources
- Return an object to extend context for children — child `beforeLoad` sees merged context
- If catching errors, always re-throw redirects: `if (isRedirect(error)) throw error`
- Auth guard uses `getAuthToken()` (sync, localStorage) + `ensureQueryData` (async, server validation)
- `ensureQueryData` returns from cache instantly on subsequent navigations; fetches only on first load/refresh

---

## Search Params

### Define with Zod — always use `.catch()` for resilience

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchSchema = z.object({
    page: z.number().int().positive().catch(1),
    sort: z.enum(['asc', 'desc']).catch('desc'),
    query: z.string().optional(),
});

export const Route = createFileRoute('/_authenticated/posts/')({
    validateSearch: searchSchema,
});
```

**Why `.catch()` over `.default()`**: `.catch()` recovers from malformed URL params silently; `.default()` only fills missing values but throws on invalid ones.

### Access in components

```tsx
// Option 1: Route hook (inside route component)
const { page, sort } = Route.useSearch();

// Option 2: getRouteApi (in child components — avoids circular imports)
const routeApi = getRouteApi('/_authenticated/posts/');
const search = routeApi.useSearch();
```

### Navigate with search params

```tsx
// Set specific values
<Link to="/posts" search={{ page: 2, sort: 'asc' }} />

// Functional updater — preserves other params
<Link to="." search={(prev) => {
    return { ...prev, page: prev.page + 1 };
}} />

// Programmatic
const navigate = useNavigate();
navigate({ search: (prev) => {
    return { ...prev, page: 2 };
} });
```

### Search params as loader deps

Never access search params directly in loaders. Use `loaderDeps`:

```tsx
export const Route = createFileRoute('/_authenticated/posts/')({
    validateSearch: searchSchema,
    loaderDeps: ({ search: { page } }) => {
        return { page };
    },
    loader: ({ deps: { page }, context: { queryClient } }) => {
        return queryClient.ensureQueryData(postsQueryOptions(page));
    },
});
```

Only include deps you actually use — extra deps cause unnecessary cache invalidations.

---

## TanStack Query Integration

### Router context setup

Router context includes `queryClient` and `auth` (discriminated union). The router is created in `src/lib/@router.tsx`:

```tsx
// src/lib/@router.tsx
import type { QueryClient } from '@tanstack/react-query';
import type { AuthContext } from '@/services/authExample/types';

type RouterContext = { queryClient: QueryClient; auth: AuthContext };

const router = createRouter({
    routeTree,
    context: {
        queryClient,
        auth: { isAuthenticated: false, me: null },
    },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    // ...
});
```

```tsx
// src/routes/__root.tsx
import type { RouterContext } from '@/lib/@router';

export const Route = createRootRouteWithContext<RouterContext>()({
    component() {
        return <Outlet />;
    },
});
```

The `_authenticated/route.tsx` `beforeLoad` returns `{ auth: { isAuthenticated: true, me } }` which merges into context for all child routes. Child `beforeLoad` and components can access `context.auth.me` with the user guaranteed to be non-null.

### Blocking data (guaranteed before render)

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { postsQueryOptions } from '@/services/posts/queries';
import { Posts } from '@/modules/Posts';

export const Route = createFileRoute('/_authenticated/posts/')({
    loader: ({ context: { queryClient } }) => {
        return queryClient.ensureQueryData(postsQueryOptions());
    },
    component: Posts,
});

// In module — data is guaranteed, use Suspense query
import { useSuspenseQuery } from '@tanstack/react-query';

function Posts() {
    const { data } = useSuspenseQuery(postsQueryOptions());

    return <PostsList posts={data} />;
}
```

### Non-blocking data (prefetch, show loading in component)

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { statsQueryOptions } from '@/services/dashboard/queries';
import { Dashboard } from '@/modules/Dashboard';

export const Route = createFileRoute('/_authenticated/dashboard/')({
    loader: ({ context: { queryClient } }) => {
        queryClient.prefetchQuery(statsQueryOptions()); // fire and forget
    },
    component: Dashboard,
});

// In module
import { useQuery } from '@tanstack/react-query';

function Dashboard() {
    const { data, isLoading } = useQuery(statsQueryOptions());

    if (isLoading) {
        return <Skeleton />;
    }

    return <Stats data={data} />;
}
```

### Mixed — fast critical + deferred slow

```tsx
async loader({ context: { queryClient } }) {
    // Block navigation until user data loads
    await queryClient.ensureQueryData(userQueryOptions());
    // Start loading recommendations without blocking
    queryClient.prefetchQuery(recommendationsQueryOptions());
},
```

### Post-mutation cache update

```tsx
// src/services/authExample/queries.ts pattern
export const loginMutationOptions = () => {
    return mutationOptions({
        mutationKey: authExampleKeys.loginMutationOptionsKey(),
        mutationFn: login,
        onSuccess(data, _variables, _onMutateResult, { client }) {
            setAuthToken(data.accessToken);
            setRefreshToken(data.refreshToken);
            return client.ensureQueryData(meQueryOptions()); // pre-fill cache
        },
    });
};

export const logoutMutationOptions = () => {
    return mutationOptions({
        mutationFn: logout,
        onSuccess(_data, _variables, _onMutateResult, { client }) {
            removeAuthToken();
            removeRefreshToken();
            client.clear();
            router.invalidate(); // re-runs all beforeLoad guards
        },
    });
};
```

---

## Navigation Patterns

### Link component

```tsx
import { Link } from '@tanstack/react-router';

<Link
    to="/dashboard"
    activeOptions={{ exact: true }}
    activeProps={{ className: 'bg-sidebar-accent text-sidebar-accent-foreground' }}
>
    Dashboard
</Link>
```

**Type-safe relative links** — use `from` to enable type narrowing:

```tsx
<Link from="/posts" to="./$postId" params={{ postId }} />
```

### Programmatic navigation

```tsx
import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router';

// From route API (type-safe to that route's search/params)
const routeApi = getRouteApi('/_unauthenticated/login/');
const navigate = routeApi.useNavigate();
navigate({ to: search.redirect || '/dashboard', replace: true });

// Generic
const navigate = useNavigate();
navigate({ to: '/login', ignoreBlocker: true }); // bypass form dirty guards
```

### Router invalidation (retry after error)

```tsx
const router = useRouter();
router.invalidate(); // re-runs loaders, re-renders
```

---

## Not-Found Handling

### Global default

```tsx
import { NotFound } from '@/components/NotFound';

const router = createRouter({
    defaultNotFoundComponent: NotFound,
});
```

### Manual not-found in loaders

```tsx
import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/posts/$postId')({
    async loader({ params }) {
        const post = await fetchPost(params.postId);
        if (!post) {
            throw notFound();
        }
        return post;
    },
    notFoundComponent() {
        return <p>Post not found</p>;
    },
});
```

### Permission-based not-found

```tsx
beforeLoad({ context: { auth } }) {
    checkIsRouteAllowed('merchants.view', auth.me.role); // throws notFound() internally
},
```

**Note:** Leaf routes (no children) cannot render their own `notFoundComponent` since they have no `<Outlet>`. Place it on a parent layout instead, or use the global default.

---

## Router Configuration

**File:** `src/lib/@router.tsx`

```tsx
import type { QueryClient } from '@tanstack/react-query';
import type { AuthContext } from '@/services/authExample/types';

type RouterContext = { queryClient: QueryClient; auth: AuthContext };

const router = createRouter({
    routeTree,
    context: {
        queryClient,
        auth: { isAuthenticated: false, me: null },
    },
    defaultPreload: 'intent',        // prefetch on hover/focus
    defaultPreloadStaleTime: 0,      // always refetch on preload
    scrollRestoration: true,         // restore scroll on back/forward
    defaultPendingMs: 100,           // show pending UI after 100ms
    defaultPendingMinMs: 500,        // keep pending UI for at least 500ms
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: ErrorComponent,
    defaultPendingComponent() {
        return <Loader className="size-16 m-auto" />;
    },
});
```

**App entry (`src/App.tsx`):**

```tsx
function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <RouterProvider router={router} />
            </ThemeProvider>
        </QueryClientProvider>
    );
}
```

---

## Code Splitting

Handled automatically by `@tanstack/router-plugin/vite` with `autoCodeSplitting: true`.

**What gets split** (non-critical): `component`, `pendingComponent`, `errorComponent`, `notFoundComponent`

**What stays in main bundle** (critical): `validateSearch`, `loader`, `beforeLoad`, `loaderDeps`, `context`

No manual `lazyRouteComponent` or `.lazy()` calls are needed in this repo.

For non-route lazy loading (e.g., devtools), use standard React `lazy()`:

```tsx
import { lazy } from 'react';
import { noopReturnNull } from '@/lib/utils/noopReturnNull';

const TanStackRouterDevtools = import.meta.env.DEV
    ? lazy(async () => {
          const res = await import('@tanstack/react-router-devtools');
          return {
              default: res.TanStackRouterDevtools,
          };
      })
    : noopReturnNull;
```