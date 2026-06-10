## What to build

Add a per-row overflow ("…") menu with a working Delete action. The "…" trigger appears on row
hover, on the selected row, and on keyboard focus. Opening the menu first selects that row, so
the action unambiguously targets it. The menu is built on the project's Base UI `Menu` +
`PopupWrapper` / `OptionItem` primitives (matching ZoomControl / PatioSort usage). For this
slice the menu contains the **Delete Object** item (trash icon, not styled destructive): clicking
it dispatches `remove` immediately, removing the object from the scene. Deletion is recoverable
via the existing undo history (no confirm dialog).

Verifiable: hover/select a row → "…" appears → open → Delete Object removes it from list and map;
undo restores it.

## Acceptance criteria

- [ ] "…" trigger shows on hover, on the selected row, and on keyboard focus.
- [ ] Opening the menu selects that row.
- [ ] Menu uses the existing Base UI Menu / PopupWrapper / OptionItem primitives.
- [ ] "Delete Object" (trash icon) removes the object immediately, no confirmation.
- [ ] Deleted object is restorable via undo.
- [ ] Type-check and lint pass.

## Blocked by

- Blocked by #3-object-list-and-selection (menu lives on a row)
