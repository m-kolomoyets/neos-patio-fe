# React-TS Project template

> by Phenomenon.Studio

This project was bootstrapped with [Vite.js](https://vitejs.dev).

---
Table of contents:
- [React-TS Project template](#react-ts-project-template)
  - [📦 Stack](#-stack)
  - [🚀 Quick start](#-quick-start)
  - [🤖 Commands](#-commands)
  - [🧶 Structure](#-structure)
    - [Core application structure](#core-application-structure)
    - [Routing \& navigation](#routing--navigation)
    - [Services \& API layer](#services--api-layer)
    - [Application configuration \& utilities](#application-configuration--utilities)
    - [Global application files](#global-application-files)
      - [Build and output directories](#build-and-output-directories)
      - [Configuration files](#configuration-files)
      - [Linting and formatting configuration](#linting-and-formatting-configuration)
      - [Git and development configuration](#git-and-development-configuration)
      - [Editor and environment configurations](#editor-and-environment-configurations)
    - [Icons](#icons)
    - [Contexts](#contexts)
    - [Hooks](#hooks)
      - [Query hooks](#query-hooks)
        - [Query Keys](#query-keys)
      - [Mutation hooks](#mutation-hooks)
    - [Utility functions](#utility-functions)
    - [Constants](#constants)
      - [Schemas](#schemas)
    - [Styles](#styles)
      - [Anatomy](#anatomy)
    - [Modules](#modules)
      - [Submodules](#submodules)
    - [Routing](#routing)
      - [`__root.tsx` file](#__roottsx-file)
      - [File-based routing](#file-based-routing)
      - [Mixing route types](#mixing-route-types)
      - [Layouts](#layouts)
      - [Route API hooks](#route-api-hooks)
  - [✳️ Icons Usage](#️-icons-usage)
---

## 📦 Stack

- **[Vite](https://vitejs.dev)** - Lightning-fast build tool with HMR;
- **[React](https://react.dev)** - Core framework with compiler optimizations;
- **[TypeScript](https://www.typescriptlang.org)** - Type-safe development with strict mode;
- **[TanStack Router](https://tanstack.com/router/latest)** - Type-safe, file-based routing with code-splitting;
- **[TanStack Query](https://tanstack.com/query/latest)** - Powerful async state management;
- **[TanStack Form](https://tanstack.com/form/latest)** - Type-safe form state management;
- **[TailwindCSS](https://tailwindcss.com)** - Utility-first styling;
- **[Ky](https://github.com/sindresorhus/ky)** - Modern HTTP client;
- **[Zod](https://zod.dev)** - TypeScript-first schema validation;
- **[ESLint](https://eslint.org)**, **[Prettier](https://prettier.io)**, **[StyleLint](https://stylelint.io)**, **[Husky](https://typicode.github.io/husky)** - Code quality and formatting;


##  🚀 Quick start

1. Install [Node.js](https://nodejs.org);
    > Require [Node.js](https://nodejs.org) version >=22
2. Install the NPM dependencies by running `npm ci`;
3. Create `.env.local` then add variables. You can look at the `.env.local.example` file;

## 🤖 Commands

-   Runs the local dev server at `localhost:9777`:
    ```
    npm run dev:vite
    ```
-   Runs the local dev server at `localhost:9777` in the scan mode:
    ```
    npm run dev:vite:scan
    ```
-   Runs `tsc` CLI in watch mode:
    ```
    npm run dev:tsc
    ```
-   Runs the local dev server and `tsc` together:
    ```
    npm run dev
    ```
-   Runs the local dev server in the scan mode and `tsc` together:
    ```
    npm run dev:scan
    ```
-   Builds your production site to `./dist/`:
    ```
    npm run build
    ```
-   Previews your build locally, before deploying at `localhost:9111`:
    ```
    npm run preview
    ```
-   Runs `tsc` CLI:
    ```
    npm run tsc
    ```
-   Checks your JavaScript/TypeScript for errors and warnings:
    ```
    npm run lint:eslint
    ```
-   Checks your CSS for errors and warnings:
    ```
    npm run lint:stylelint
    ```
-   Checks your code formatting:
    ```
    npm run lint:prettier
    ```
-   Checks your code all together:
    ```
    npm run lint
    ```
-   Fixes your code formatting:
    ```
    npm run fix:prettier
    ```
-   Finds and fixes unused dependencies, exports and files:
    ```
    npm run knip
    ```
-   Installs husky:
    ```
    npm run prepare
    ```

## 🧶 Structure


### Core application structure

-   `src/components` - contains shared components with business logic. These are reusable components that may include some business logic. Each component should consist of:
    -   `index.tsx` - the component file itself;
    -   `styles.module.css` - styles of component file. This file is optional, since we use TailwindCSS;
    -   `types.ts` - types of component file (optional);
    -   `hooks` - contains component hooks dir (optional). Should consist of:
        -   `<hookName>.ts` - the hook file itself;
    -   `constants.ts` - constants of component file (optional);
    -   `utils` - utils dir of component file (optional). Should consist of:
        -   `<utilName>.ts` - the util file itself;
    -   `schemas.ts` - schemas of component file (optional);
    -   `regexps.ts` - regexps of component file (optional);
    -   `context` - the context dir of component file (optional). Should consist of:
        -   `<ContextName>.tsx` - the context file itself;
    -   `components` - the components dir of components (optional). Should consist of like `src/components`;

-   `src/components/layouts` - contains layout components for different application layouts. Each layout component should:
    -   have same structure as `src/components` has;
    -   include `<Outlet />` as a child of component;

-   `src/components/ui` - contains basic UI components without business logic like button, input etc. Each component should consist of that files:
    -   `index.tsx` - the component file itself;
    -   `styles.module.css` - styles of component file. This file is optional, since we use TailwindCSS;
    -   `types.ts` - types of component file (optional);
    -   `hooks` - contains component hooks dir (optional). Should consist of:
        -   `<hookName>.ts` - the hook file itself;
    -   `constants.ts` - constants of component file (optional);
    -   `schemas.ts` - schemas of component file (optional);
    -   `regexps.ts` - regexps of component file (optional);
    -   `utils` - utils dir of component file (optional). Should consist of:
        -   `<utilName>.ts` - the util file itself;

-   `src/modules` - contains independent features that have their own area of responsibility. These features can fetch data and have complete business logic. Each module should consist of:
    -   `index.tsx` - the component file itself;
    -   `styles.module.css` - styles of component file. This file is optional, since we use TailwindCSS;
    -   `types.ts` - types of component file (optional);
    -   `hooks` - contains component hooks dir (optional). Should consist of:
        -   `<hookName>.ts` - the hook file itself;
    -   `constants.ts` - constants of component file (optional);
    -   `utils` - utils dir of component file (optional). Should consist of:
        -   `<utilName>.ts` - the util file itself;
    -   `schemas.ts` - schemas of component file (optional);
    -   `regexps.ts` - regexps of component file (optional);
    -   `context` - the context dir of component file (optional). Should consist of:
        -   `<ContextName>.tsx` - the context file itself;
    -   `components` - the components dir of components (optional). Should consist of like `src/components`;

### Routing & navigation

-   `src/routes` - application route definitions using Tanstack Router with file-based routing. Should contain `src/modules` and may have other route-specific components. Read more [here](https://tanstack.com/router/latest/docs/framework/react/overview);

### Services & API layer  

-   `src/services` - contains service layer for API calls and external integrations:
    -   `<serviceName>/` - service directories organized by feature or domain;
        - `api.ts` - API service file;
        - `queries.ts` - file with queries and mutations hooks;
        - `queryKeys.ts` - file with queries and mutations keys;
        - `types.ts` - types of service file: request and response types;
  

### Application configuration & utilities

-   `src/lib` - contains core application utilities and configurations:
    -   `@http.ts` - HTTP client configuration and utilities;
    -   `@queryClient.ts` - Tanstack Query client configuration;
    -   `constants.ts` - global application constants;
    -   `schemas.ts` - global validation schemas;
    -   `regexps.ts` - global regular expressions;
    -   `types.ts` - global TypeScript type definitions;
    -   `utils/` - global utility functions directory:
        -   `<utilDirName>/` - directory for grouped utility functions (optional);
        -   `<utilName>.ts` - individual utility files;

### Global application files

-   `src/hooks` - contains global hooks directory:
    -   `<hookName>.ts` - global hook files;
-   `src/context` - global React context providers:
    -   `<ContextName>.tsx` - global context files;
-   `src/styles` - contains global style files:
    -   `index.css` - the main CSS file;
-   `src/main.tsx` - entry point of the application;
-   `src/vite-env.d.ts` - Vite environment type definitions. This file should be updated every time you add new environment variables;
-   `src/routeTree.gen.ts` - auto-generated route tree file (do not edit manually);
-   `public/` - can contain static files such as images, fonts, videos, documents, favicons, etc.;


#### Build and output directories

-   `dist/` - production build output directory (generated after `npm run build`);
-   `tmp/` - temporary files directory containing:
    -   `bundle-visualizer.html` - bundle size analysis report (generated after build with rollup-plugin-visualizer);

#### Configuration files

-   `index.html` - main HTML template file with meta tags, font loading, and root div element;
-   `vite.config.ts` - Vite configuration including plugins, build settings, and dev server options;
-   `tsconfig.json` - main TypeScript configuration;
-   `tsconfig.app.json` - TypeScript configuration for application code;
-   `tsconfig.node.json` - TypeScript configuration for Node.js (Vite config);
-   `package.json` - project dependencies, scripts, and metadata;
-   `package-lock.json` - exact dependency versions lock file;

#### Linting and formatting configuration

-   `eslint.config.js` - ESLint configuration for JavaScript/TypeScript linting;
-   `prettier.config.js` - Prettier configuration for code formatting;
-   `.prettierignore` - files and directories to ignore during Prettier formatting;
-   `.stylelintrc` - Stylelint configuration for CSS linting;

#### Git and development configuration

-   `.gitignore` - Git ignore rules specifying which files to exclude from version control;
-   `.gitattributes` - Git attributes configuration for line endings and file handling;
-   `.husky/` - Git hooks directory for pre-commit and commit-msg validation;
-   `commitlint.config.cjs` - commit message linting configuration;

#### Editor and environment configurations

-   `.editorconfig` - editor configuration for consistent coding styles;
-   `.npmrc` - NPM configuration settings;
-   `.env.local.example` - example environment variables file (template for `.env.local`);
-   `.env.local` - local environment variables (should be created manually, not committed to git);

### Icons

Icons should be located at `src/icons` folder.

Every icon should:
- Have lowercase name with kebab case formatting (example: `profile.svg` or `airplane-landing.svg`)

Prerequisites:
- Compress exported SVG with [SVGOMG](https://jakearchibald.github.io/svgomg/) tool

### Contexts

Contexts are optional for the root of the project and components among all the project.

No matter, where the contexts will appear, they should:
- Have separate `contexts` folder inside the folder where the hooks will be used
  - Global contexts will be used in all the project, should be located at `src/contexts` folder. NOTE: Any component is allowed to call such contexts.
  - If context will be used inside single component exclusively, you should create `contexts` folder inside the component folder. Example: `src/components/ArticleCard/contexts`. NOTE: such contexts are not allowed to be used outside of the component scope where the hooks folder were created. If such case appears, then you should move the hook(s) into global hooks folder. The child components (`src/components/ArticleCard/components/*`) only are allowed to use the context inside

Each context should:
- Be created inside the `contexts` folder
- Have pascal case name, ending with `<contextName>Context` (example: `AuthContext.tsx`)
- NOTE: The context file name should match the context name inside the file

``` ts
// src/contexts/AuthContext.tsx

const AuthContext = createContext(...);
```

### Hooks

Hooks are optional for the root of the project and components among all the project.

No matter, where the hooks will appear, they should:
- Have separate `hooks` folder inside the folder where the hooks will be used
  - Global hooks will be used in all the project, should be located at `src/hooks` folder
  - If hook will be used inside single component exclusively, you should create `hooks` folder inside the component folder. Example: `src/components/ArticleCard/hooks`. NOTE: such hooks are not allowed to be used outside of the component scope where the hooks folder were created. If such case appears, then you should move the hook(s) into global hooks folder

Each hook should:
- Be created inside the `hooks` folder
- Have camel case name, starting with `use` (example: `useHavePermissions.ts`)
- NOTE: The hook file name should match the hook name inside the file

``` ts
// src/hooks/useHavePermissions.ts

export const useHavePermissions = () => {...}
```

#### Query hooks

Query hooks can have the parameters to be passed like pagination, search params etc. These parameters should be passed into hooks as arguments. Recommended to pass the arguments as list of arguments, not as the object.

Query keys should be defined as described in [`Query keys`](#query-keys) section.

Example:
```ts
export const useGetBooks = (search: string) => {
    return useQuery({
        queryKey: BOOKS_QUERY_KEYS.listWithParams({ search })
        // ...
    })
}

export const useGetBooksByAuthorName = (authorName: string, search: string) => {
    return useQuery({
        queryKey: BOOKS_QUERY_KEYS.itemByAuthor(authorName, { search })
        // ...
    })
}
```

##### Query Keys

It is also recommended to manage query keys in appropriate way to use them inside project.

First things first, you should create the constant that includes queryKeys:
```ts
// src/services/books/queryKeys.ts

export const BOOKS_QUERY_KEYS = {
    all: ['books'] as const,
    list() {
        return [...BOOKS_QUERY_KEYS.all, 'list'] as const
    },
    listWithParams(params: { search: string }) {
        return [...BOOKS_QUERY_KEYS.list(), params] as const
    }
    // ...
}
```

>NOTE: Query keys contacts are allowed to be used in all the project to make invalidations and prefetched possible on a lot of events occur by user activities.

And apply this in:
- Query hooks:
  ```ts
  export const useGetBooks = (search: string) => {
    return useQuery({
        queryKey: BOOKS_QUERY_KEYS.listWithParams({ search })
        // ...
    })
  }
  ```
- Query options:
  ```ts
  export const getBooksQueryOptions = (search: string) => {
    return queryOption({
        queryKey: BOOKS_QUERY_KEYS.listWithParams({ search })
        // ...
    });
  }

  export const useGetBooks = (search: string) => {
    return useQuery(getBooksQueryOptions(search));
  }
  ```
- Query invalidations:
  ```ts
  import { BOOKS_QUERY_KEYS } from '@/services/books/queryKeys';

  queryClient.invalidateQueries({
    queryKey: BOOKS_QUERY_KEYS.list()
  })
  ```
- Query prefetches:
  ```ts
  import { BOOKS_QUERY_KEYS } from '@/services/books/queryKeys';

  queryClient.prefetchQuery({
     queryKey: BOOKS_QUERY_KEYS.list()
  })

  // or

  queryClient.getQueryData({
     queryKey: BOOKS_QUERY_KEYS.list()
  })
  ```

#### Mutation hooks

Mutation hooks from `useMutation` return the callable function as result, so no need to pass the arguments into hook call. But everything can happen to pass initial arguments into hook body directly for query client logic or whatever.

```ts
// src/services/books/api.ts
export const addBookToFavorites = (bookId: string) => {...}
```

```ts
// src/services/books/queries.ts
import { addBookToFavorites } from './api';

export const addBookToFavoritesMutationOptions = () => {
    return mutationOptions({
        mutationFn: addBookToFavorites
        // ...
    })
}
```
```ts
// somewhere
import { useMutation } from '@tanstack/react-query';
import { addBookToFavoritesMutationOptions } from '@/services/books/queries';

// ...

const { mutate: addBookToFavorites } = useMutation(addBookToFavoritesMutationOptions());

// ...

addBookToFavorites(bookId, {...})
```

### Utility functions

Utility functions are optional for the root of the project and components among all the project.

No matter, where the utils will appear, they should:
- Have separate `utils` folder inside the folder where the utils will be used
  - Global utils will be used in all the project, should be located at `src/utils` folder
  - If util will be used inside single component exclusively, you should create `utils` folder inside the component folder. Example: `src/components/ArticleCard/utils`. NOTE: such utils are not allowed to be used outside of the component scope where the utils folder were created. If such case appears, then you should move the util(s) into global utils folder

Each util should:
- Be created inside the `utils` folder
- Have camel case name (example: `getHasPermissions.ts`)
- NOTE: The util file name should match the util name inside the file
- (Optional): Unit tests can be written for the util
  - `<utilName>.ts` -> `<utilName>.test.ts`

``` ts
//getHasPermissions.ts

export const getHasPermissions = () => {...}
```

### Constants

Constants are optional for the root of the project and components among all the project.

There are 2 types of constants to use:
- Regular constants (`constants.ts`)
- Schemas constants (`schemas/` folder)

The rules described below are applied for both of them.
The only difference is:
- `constants.ts` - for regular constants like time tokens, regexps etc.
- `schemas/` folder - for `zod` schemas will be used in other schemas in all the project

No matter, where the constants will appear, they should:
- Have separate `constants.ts` file inside the folder where the constants will be created
  - Global constants will be used in all the project, should be located at `src/constants.ts` file
  - If constants will be used inside single component exclusively, you should create `constants.ts` file inside the component folder. Example: `src/components/ArticleCard/constants.ts`.
   >NOTE: such constants are not allowed to be used outside of the component scope where the constants file were created. If such case appears, then you should move the constants(s) into global constants file

#### Schemas

Schemas should:
- Have separate `schemas` folder inside the folder where the schemas will be used
  - Global schemas will be used in all the project, should be located at `src/schemas/` folder
  - If schemas will be used inside single component exclusively, you should create `schemas/` folder inside the component folder. Example: `src/components/ArticleCard/schemas/`.
- Each schema should have camel case name with ending `<schemaName>Schema.ts`.
- Each schema should have its inferred type

Few more thing should be applied to schemas:
```ts
import { z } from 'zod';
// ...

export const signUpSchema = z.object({...});
export type SignUpSchema = z.infer<typeof signUpSchema>;
```

### Styles

Styles are optional for the root of the project and components among all the project.

The global styles are located inside `src/styles` folder
This folder should include:
- `index.css` - root project styles (incl. imports of other root style files described below)
- `reset.css` - predefined browsers styles reset file
- `variables.css` - (optional) global variables file. This file can be created if there are a lot of variables to create and manage them easily. In case of ~25 variables they can still be maintained in `index.css`.
- `fonts.css` - (optional) global fonts to be implemented through `@font-face` directive.



#### Anatomy

The component should:
- Have separate folder
- Have pascal case name (example: `Button` or `ArticleCard`)
- Have default export of the component itself

The component folder should contain:
- `index.tsx` - the component JSX, entry points of component
- `styles.module.css` - the styles of component file (optional)

> NOTE: If component has to haves hooks/utils/constants/contexts, take a look at relevant chapters above.

### Modules

Modules are core blocks are used for routing. Router entries render modules only. It is not allowed to pass the components from `src/components` or `src/ui`.

Modules are located at `src/modules` folder.

Modules represent pages we should display within router. Modules hierarchy may also represent the routes subrouting.

Every module should:
- be named for the route it represent:
  - `http://localhost:3000/about` -> `src/modules/About`
- have the same architecture as `src/components` or `src/ui` as described above
- have no props
- module name should match the module component name:
  ```ts
  // src/modules/About/index.tsx

  export const About: React.FC = () => {...}
  ```

Modules are allowed:
- to use `src/components` and/or `src/ui` components inside
- to have own hooks
- to have own constants/schemas/styles
- to have own sub-modules and/or sub-components (`src/modules/About/components/...`)
- to use its sub-modules inside if it is not a sub-route

#### Submodules

Submodules are the modules inside the some module (`src/modules/About/components/...`).

Submodules may have everything regular modules can have and do, but they can be used in two ways:
- as sub-component for the rot module
  - but it is already not allowed to be used as sub-route
- as sub-route:
  - `src/modules/About/components/Settings` -> `http://localhost:3000/about/settings`

### Routing

Tanstack Router is used as main router utility with file-based routing functionality.

Routes are located at `src/routes` folder.

#### `__root.tsx` file

Thi file is used to set up the initial router with global component and parameters.

Root file may include:
- Devtools
- Global context providers
- 404 page set up

#### File-based routing

All files and folders inside `src/routes` folder are represented as client routes by the file name:
```
src/routes/index.tsx -> http://localhost:3000/
src/routes/about.tsx -> http://localhost:3000/about
```

Folders cam include the subroutes and index route:
```
src/routes/about/index.tsx -> http://localhost:3000/about
src/routes/about/settings/index.tsx -> http://localhost:3000/about/settings
```

Routes can be lazy-loaded or not.

Lazy-loaded routes can:
- render the module dynamically when the route is called
- include pending components
- include error component
- include 404 component

Regular route can:
- everything lazy-loaded routes can
- validate search parameters
- perform prefetches with loader
- perform actions before loader executes

>NOTE: regular routes have more memory load, so if no need in search parameters load or prefetch, plea use lazy routes.

Route have different file naming convection inside `src/routes` folder:

Routes should:
- be named with kebab-case lowercase (`src/routes/<route-name>/`)
- have index file with `.tsx` extension (`src/routes/<route-name>/index.tsx`)
- If lazy - add `.lazy` before `.tsx` (`src/routes/<route-name>/index.lazy.tsx`)
- have no props
- have route module name matched to route name but pascal-case ending with `<ModuleName>Page`:
  ```ts
  // src/routes/about/index.tsx

  import About from '@/modules/about';

  const AboutPage = createLazyFileRoute('/about')({
    component: About
  })
  ```

#### Mixing route types

There is possibility to have route mixing between lazy and regular.

We are able to split the logic this way:
- Regular route
  - validate search parameters
  - perform prefetches with loader
  - perform actions before loader executes
- Lazy route
  - render the module dynamically when the route is called

In terms of code it looks this way:

Folder structure:
```
src/
└── routes/
    └── about/
        ├── index.tsx
        └── index.lazy.tsx
```

```ts
// index.lazy.tsx

import About from '@/modules/about';

const AboutPage = createLazyFileRoute('/about')({
    component: About
})

// index.tsx
import { noopReturnNull } from '@/utils/noopReturnNull';

const AboutPage = createFileRoute('/about')({
    component: noopReturnNull,
    validateSearch(search) {...},
    beforeLoad() {...}
    loader({ search }) {...},
})
```

#### Layouts

Tanstack router allows to create layouts.

Layouts should:
- be named for layout semantics, kebab-case, starting with `_` and ending with `-layout`:
  - Example: `src/routes/_protected-layout/`
- have both folder and file (not lazy) named by this layout:
  ```
  src/
    └── routes/
        ├── _protected-layout/
        │   └── index.lazy.tsx
        └── _protected-layout.tsx
  ```

Layout component should be stored at `src/components/layouts` folder.

Layout components should:
- have same structure as `src/components` have
- include `<Outlet />` a child of component
- have no props

```ts
// src/components/layouts/ProtectedLayout/index.tsx
import { Outlet } from '@tanstack/react-router';

const ProtectedLayout: React.FC = () => {
    return (
        <div>
            // ...
            <Outlet />
        </div>
    )
}

// src/routes/_protected-layout.tsx

import ProtectedLayout from '@/components/layouts/ProtectedLayout';

const ProtectedLayoutPage = createFileRoute('/_protected-layout')({
    component: ProtectedLayout
    // ...
})
```

#### Route API hooks

Routes have own hooks like `useSearch` and `useNavigate` or other that `getRouteApi` return ([docs](https://tanstack.com/router/v1/docs/framework/react/api/router/getRouteApiFunction)). For optimizing the router tree iterations and by following the maintainer recommendations we should have the `from` attribute predefined for each route we have the hooks calls at.

it is recommended to create custom route hooks for each module as follows:
- be located in module hooks folder
- have name based on module name: `src/modules/<ModuleName>/` -> `src/modules/<ModuleName>/hooks/use<ModuleName>RouteApi.ts`:
  - Example: `src/modules/About/` -> `src/modules/About/hooks/useAboutRouteApi.ts`

```ts
// src/modules/About/hooks/ueAboutRouteApi.ts

import { getRouteApi } from '@tanstack/react-router';

const aboutRouteApi = getRouteApi('/about');

export const ueAboutRouteApi = () => {
    const search = aboutRouteApi.useSearch();
    const navigate =  aboutRouteApi.useNavigate();

    return { search, navigate };
}

// src/modules/About/index.tsx

const About: React.FC = () => {
    const { search, navigate } = ueAboutRouteApi();

    // ...
}
```

If no search needed, you may just return the navigate. Route API logic allows us to get the route data directly by setting the entry point as route id, which is autocompleted in dev mode launched.

This methodology can be applied to layouts a well.

## ✳️ Icons Usage

1. Collect all icons as separate files with `.svg` extension and kebab-case naming.

Example:
```md
src
├── icons
│   ├── arrow-left.svg
│   ├── search.svg
│   └── arrow-right-circle.svg
```

2. Import icon required as follows:
```ts
import ArrowLeftIcon from '@/icons/arrow-left.svg?react';
```

3. Use the icon as regular JSX component:
```tsx
<ArrowLeftIcon className={s.icon} />
```

SVGs are transformed into React components by [`vite-plugin-svgr`](https://github.com/pd4d10/vite-plugin-svgr), which wraps [SVGR](https://react-svgr.com) under the hood. The resulting component accepts all standard `SVGProps<SVGSVGElement>` (e.g. `className`, `width`, `height`, `fill`, `stroke`, `aria-*`, event handlers, etc.).

```ts
import type { SVGProps } from 'react';

declare const ArrowLeftIcon: React.FC<SVGProps<SVGSVGElement>>;
```

Key moments:

- 👉 Use the default export and name it according to the icon (e.g. `ArrowLeftIcon`).
- 👉 Autocomplete will support the path to the svg file, ⚠️BUT⚠️ you must append the `?react` query param to the import path so `vite-plugin-svgr` transforms the SVG into a React component.
- 👉 Style icons via `currentColor` in the SVG source and control color through CSS `color` on the parent — this keeps icons themeable without extra props.
