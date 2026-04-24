import React from 'react';
import ReactDOM from 'react-dom/client';
import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { WagmiProvider } from 'wagmi';
import { queryClient } from '@/lib/@queryClient';
import { envSchema } from '@/lib/schemas';
import { checkEnv } from '@/lib/utils/checkEnv';
import { wagmiConfig } from './lib/wagmi';
import { ErrorFallback } from './modules/ErrorFallback';
import { routeTree } from './routeTree.gen';

import '@rainbow-me/rainbowkit/styles.css';
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
    defaultErrorComponent: ErrorFallback,
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
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={darkTheme()}>
                    <RouterProvider router={router} />
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    </React.StrictMode>
);
