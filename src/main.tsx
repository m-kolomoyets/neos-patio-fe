import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { queryClient } from '@/lib/@queryClient';
import { envSchema } from '@/lib/schemas';
import { checkEnv } from '@/lib/utils/checkEnv';
import { routeTree } from './routeTree.gen';

import '@/styles/index.css';

const router = createRouter({
    routeTree,
    context: {
        queryClient,
    },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    defaultPendingMs: 100,
    defaultPendingMinMs: 500,
    // TODO: Add when UI designs are ready
    // defaultNotFoundComponent: NotFound,
    // defaultErrorComponent: ErrorComponent,
    // defaultPendingComponent() {
    //     return <Loader className="size-16 m-auto" />;
    // },
});
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

checkEnv(envSchema);
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </React.StrictMode>
);
