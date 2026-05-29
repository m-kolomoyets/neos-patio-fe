## What to build

Create `UndoRedoHistory` — a pure generic stack utility with `push(prev)`, `undo(current)`, `redo(current)`, `canUndo`, `canRedo`, and a configurable cap (default 50). Integrate into the editor reducer: every mutating action (`add`, `remove`, `transform`) pushes the prior `objects` snapshot. Add `undo` / `redo` actions to the reducer. Wire toolbar buttons.

## Acceptance criteria

- [ ] `src/modules/PatioEditor/utils/undoRedoHistory.ts` exports a pure factory returning `{ push, undo, redo, canUndo, canRedo }`
- [ ] History caps at 50 entries (oldest evicted)
- [ ] Redo stack clears on any new mutating action
- [ ] Reducer pushes prior state on `add`, `remove`, `transform`
- [ ] Reducer handles `undo` / `redo`
- [ ] Toolbar undo/redo buttons disabled when their stack is empty
- [ ] Undo after add removes the object; redo re-adds it
- [ ] Undo after gizmo move restores the prior position
- [ ] `npm run tsc` and `npm run lint` clean

## Blocked by

- Blocked by `06-selection-and-gizmo.issue.md`
