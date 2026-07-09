---
name: base-ui
description: Wrap Base UI (@base-ui/react) primitives into this project's UI layer following the established Button/Tabs/Typography pattern — co-located folder with `index.tsx` + `styles.module.css` + `types.ts`, CSS modules with design tokens, `clsx` composition, data-attribute variants, and re-exported Base UI prop types. Use when adding a new Base UI component, wiring a Base UI primitive into `src/components/ui`, or translating a Base UI example into this codebase.
user-invocable: false
---

# Base UI — Project Integration Guide

This project uses [Base UI](https://base-ui.com) (`@base-ui/react`) as the headless primitive layer. All Base UI primitives must be wrapped inside `src/components/ui/<Component>/` before being consumed by features.

## Reference: component catalogue

Before picking a primitive, consult the official component index:

**https://base-ui.com/llms.txt**

That file lists every Base UI component, its import path, the sub-parts it exposes, and links to the full docs. Fetch it when:

- You don't know if Base UI already ships the primitive you need.
- You need the exact sub-part names for a compound component (e.g. `Dialog.Root`, `Dialog.Trigger`, `Dialog.Popup`, ...).
- You need the import path (`@base-ui/react/<component>`).

Do **not** guess sub-part names or import paths from memory — verify against llms.txt.

## Folder layout

Every UI component lives in its own folder:

```
src/components/ui/<Component>/
├── index.tsx          # wrappers + compound export
├── styles.module.css  # CSS module, design-token driven
└── types.ts           # re-exported Base UI prop types + project-specific props
└── constants.ts           # (optional) re-exported Base UI constants are used only in this component: configurations, number values make sense
```

Reference implementations already in the repo: `src/components/ui/Button`, `src/components/ui/Tabs`, `src/components/ui/Typography`.

## Rules

### 1. Import from the component-specific subpath

```ts
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { Button as BaseButton } from '@base-ui/react/button';
```

Never `import { Tabs } from '@base-ui/react'` — always the per-component path as listed in llms.txt. Alias the Base UI import to `Base<Name>` so the wrapper can keep the original name.

### 2. Compound components → object export

For primitives with multiple parts (Tabs, Dialog, Menu, Select, ...), wrap each part as an internal `React.FC` and export a single frozen object:

```tsx
// src/components/ui/Tabs/index.tsx
const Root: React.FC<TabsRootProps> = ({ className, ...rest }) => (
    <BaseTabs.Root className={clsx(s.root, className)} {...rest} />
);
// ...List, Tab, Indicator, Panel

export const Tabs = { Root, List, Tab, Indicator, Panel };
```

Consumers then write `<Tabs.Root>...<Tabs.Tab />...</Tabs.Root>`.

### 3. Single-part components → named export

Button has one part, so it is exported directly:

```tsx
export const Button: React.FC<ButtonProps> = ({ className, ...rest }) => (
    <BaseButton className={clsx(s.wrap, className)} {...rest} />
);
```

### 4. Types — re-export from Base UI, extend when needed

```ts
// types.ts
import type { Tabs as BaseTabs } from '@base-ui/react/tabs';

export type TabsRootProps = BaseTabs.Root.Props;
export type TabsListProps = BaseTabs.List.Props;
// one type per sub-part, named <Component><Part>Props
```

For primitives that accept `render` / polymorphic props (like `Button`), use `useRender.ComponentProps<'button'>` from `@base-ui/react/use-render` and intersect project-specific props:

```ts
import { useRender } from '@base-ui/react/use-render';

export type ButtonProps = useRender.ComponentProps<'button'> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isIcon?: boolean;
    isLoading?: boolean;
};
```

Document each custom prop with a JSDoc block including `@default` and `@see` where applicable.

### 5. ClassName composition with `clsx`

Always merge in the order: local CSS module class → global utility classes → consumer `className`.

```tsx
className={clsx(s.wrap, 'focus-primary', className, {
    'surface-thin': variant === 'surface',
})}
```

Known global utility classes in this project: `focus-primary`, `surface-thin`, `surface-thicker`. Use them instead of re-implementing focus rings or surface treatments.

### 6. Variants via `data-*` attributes, not class name unions

Drive visual variants from `data-` attributes on the root element, then style via `[data-attr="value"]` selectors in the CSS module. This keeps the component API flat and matches Base UI's own data-attribute conventions (`data-selected`, `data-active`, ...).

```tsx
<BaseButton
    data-button-variant={variant}
    data-button-size={size}
    data-button-is-icon={isIcon}
    data-button-is-loading={isLoading}
    disabled={isLoading || disabled}
/>
```

Naming: `data-<component>-<prop>`, kebab-case.

### 7. CSS modules + design tokens

- File name is always `styles.module.css`, imported as `import s from './styles.module.css'`.
- Use CSS custom properties from the design system (`@/styles/index.css`) — never raw numbers for spacing, radii, colors. Examples: `var(--gap-2)`, `var(--radius-full)`, `var(--color-base-white)`, `var(--stroke-surface)`.
- Style Base UI state via its data-attributes: `[data-selected]`, `[data-active]`, `[data-disabled]`, `:disabled`, etc.
- Style project variants via the `data-<component>-*` attributes set in JSX, e.g. `.root[data-tabs-size="md"] .tab { ... }`.

### 8. Forward all unknown props

Destructure only what the wrapper needs (`className`, project-specific props); spread `...rest` onto the Base UI part so controlled props, `render`, `ref`, event handlers, ARIA attributes, etc. continue to work.

### 9. Loading & disabled state

Gate `disabled` through a boolean OR with `isLoading` so a loading button cannot be clicked: `disabled={isLoading || disabled}`. Render loading affordances (e.g. spinner icon) inside the Base UI part, before `children`.

### 10. Icons

Import SVGs as React components via the `?react` query: `import Spinner20Icon from '@/icons/spinner_20.svg?react'`. Size is encoded in the file name (e.g. `spinner_20` = 20px).

## Adding a new Base UI component — checklist

1. Fetch https://base-ui.com/llms.txt and confirm the component, its import path, and sub-parts.
2. Create `src/components/ui/<Component>/{index.tsx,styles.module.css,types.ts}`. Create optional files only if there is a need for them.
3. In `types.ts`, re-export every sub-part's `Props` type as `<Component><Part>Props`.
4. In `index.tsx`, wrap each sub-part with a `React.FC` that merges classes via `clsx` and forwards `...rest`.
5. Export a compound object (multi-part) or a named component (single-part).
6. Style with CSS module + design tokens; drive variants through `data-*` attributes.
7. If the component needs polymorphism, use `useRender.ComponentProps<'tag'>` from `@base-ui/react/use-render`.
8. Add a demo to the `ui-kit` route so the component is visually verifiable.