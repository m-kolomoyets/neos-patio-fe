## What to build

Hoist `prefers-reduced-motion` and `isSlowConnection()` checks from the card hook to the parent. When either gate is active, the parent keeps the render-window Set empty so no card receives `shouldMountVideo = true`. Card hook stops performing these checks itself and treats them as the parent's responsibility. Image-only path applies for gated users: no video mounts, no snap writes, no hover scrub side effects.

## Acceptance criteria

- [ ] Parent reads `prefers-reduced-motion` and `isSlowConnection()` once on mount (and on media-query change for reduced-motion).
- [ ] When either gate is active, render-window Set stays empty and no card mounts video.
- [ ] Card hook no longer checks `prefers-reduced-motion` or slow connection internally.
- [ ] With `prefers-reduced-motion: reduce` toggled on, no video element appears anywhere in the carousel; image-only path; no scroll-driven seek attempts.
- [ ] With `connection.effectiveType = '2g'` or `saveData: true`, same image-only behavior.
- [ ] Hover on a card under either gate produces no video mount and no scrub side effects.
- [ ] Type-check and lint pass.

## Blocked by

- Blocked by `03-render-window-mount-gating.issue.md`
