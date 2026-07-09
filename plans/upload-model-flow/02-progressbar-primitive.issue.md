## What to build

A global ProgressBar UI primitive wrapping Base UI `Progress` — a determinate linear bar
driven by a 0–100 `value`, styled with design tokens. Reusable in both the upload dialog and
the sidebar pending item.

## Acceptance criteria

- [ ] `src/components/ui/ProgressBar/` exists (index + styles.module.css + types), wrapping Base UI `Progress`, re-exporting its prop types
- [ ] Determinate; accepts `value` 0–100; fill animates with value
- [ ] Tokenized fill/track; no business logic
- [ ] Renders correctly at 0, partial, and 100
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

None - can start immediately
