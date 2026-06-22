## What to build

A new UI primitive `LoadingSpinnerWithLogo` — the branded spinner shown in the loading overlay. It reuses the existing `LoadingSpinner`'s conic-gradient ring and places the Neos logo SVG (`src/icons/logo-sm_35.svg`, imported with `?react`) absolutely centered inside it. The ring spins; the logo is static. The logo uses `currentColor`, so its tint follows CSS `color`. Sizing is controllable via `className`, with the logo scaling relative to the ring.

Own folder under `src/components/ui/LoadingSpinnerWithLogo/` (`index.tsx` + `styles.module.css`), following repo component anatomy.

## Acceptance criteria

- [ ] `LoadingSpinnerWithLogo` renders a spinning ring with the logo centered and static
- [ ] Logo tints to white (via `currentColor`) against a dark background
- [ ] `className` controls overall size; logo scales proportionally
- [ ] Reuses the existing `LoadingSpinner` ring visuals rather than reinventing them
- [ ] Component is presentational (no business logic), matching the Figma spinner

## Blocked by

- None - can start immediately
