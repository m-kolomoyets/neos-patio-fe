# 05 — Copy link + dots menu

## What to build

The remaining two action-bar controls: a copy-link button that copies the model's file URL with a confirmed checkmark state, and a dots overflow menu that exposes a Delete option reserved for the future (rendered disabled).

End-to-end: press copy → `gltfUrl` is on the clipboard, button shows a checkmark briefly, then reverts. Open the dots menu → see a disabled Delete item.

## Acceptance criteria

- [ ] Copy-link button copies `gltfUrl` via `navigator.clipboard.writeText`.
- [ ] After copying, the button swaps to a checkmark for ~2s then reverts (local state, no toast).
- [ ] Dots button opens a Base UI Menu; a thin `Menu` ui wrapper is added under `src/components/ui` following the existing primitive pattern (or Base UI menu is used directly if a wrapper is unwarranted).
- [ ] Menu contains a single `Delete` item rendered disabled (no delete wiring).
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #03-3d-preview
