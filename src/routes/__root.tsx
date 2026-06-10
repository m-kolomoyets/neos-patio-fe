import React from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';

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

export const Route = createRootRoute({
    component() {
        return (
            <>
                <Outlet />
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
            </>
        );
    },
});
