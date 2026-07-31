import React from 'react';
import { PageTransitionProvider } from '@/contexts/PageTransitionContext';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { FONT_DEBUG_SEARCH_PARAM } from '@/modules/FontDebug/constants';
import { NotFound } from '@/modules/NotFound';
import { PageTransitionOverlay } from '@/components/PageTransitionOverlay';

const TanStackDevtools = import.meta.env.DEV
    ? React.lazy(async () => {
          const res = await import('@tanstack/react-devtools');

          return {
              default: res.TanStackDevtools,
          };
      })
    : () => {
          return null;
      };

const TanStackRouterDevtoolsPanel = import.meta.env.DEV
    ? React.lazy(async () => {
          const res = await import('@tanstack/router-devtools');

          return {
              default: res.TanStackRouterDevtoolsPanel,
          };
      })
    : () => {
          return null;
      };

const ReactQueryDevtoolsPanel = import.meta.env.DEV
    ? React.lazy(async () => {
          const res = await import('@tanstack/react-query-devtools');

          return {
              default: res.ReactQueryDevtoolsPanel,
          };
      })
    : () => {
          return null;
      };

// Temporary font-weight tuning tool — enabled with `?font-debug`. Delete these three
// blocks and `src/modules/FontDebug/` to remove it.
const isFontDebugEnabled = new URLSearchParams(window.location.search).has(FONT_DEBUG_SEARCH_PARAM);
const FontDebugPanel = React.lazy(async () => {
    const res = await import('@/modules/FontDebug');

    return {
        default: res.FontDebugPanel,
    };
});

export const Route = createRootRoute({
    notFoundComponent: NotFound,
    component() {
        return (
            <PageTransitionProvider>
                <Outlet />
                <PageTransitionOverlay />
                {isFontDebugEnabled && (
                    <React.Suspense>
                        <FontDebugPanel />
                    </React.Suspense>
                )}
                <React.Suspense>
                    <TanStackDevtools
                        config={{
                            position: 'bottom-left',
                        }}
                        plugins={[
                            {
                                name: 'TanStack Query',
                                render: <ReactQueryDevtoolsPanel />,
                                defaultOpen: true,
                            },
                            {
                                name: 'TanStack Router',
                                render: <TanStackRouterDevtoolsPanel />,
                                defaultOpen: false,
                            },
                        ]}
                    />
                </React.Suspense>
            </PageTransitionProvider>
        );
    },
});
