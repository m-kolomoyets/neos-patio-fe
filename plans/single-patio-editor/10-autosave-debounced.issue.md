## What to build

Add the autosave path end-to-end. Stub `updatePatioObjects(id, objects)` in `src/services/patios/api.ts` (200ms delay, in-memory mutation that preserves object ids). Add `updatePatioObjectsMutationOptions(id)` to `src/services/patios/queries.ts` (invalidates `patiosKeys.detail(id)` on success). Build `useAutosavePatio(id)` that watches `objects` from `EditorContext`, debounces ~600ms, fires the mutation, and surfaces `idle` / `saving` / `saved`. Show the status in `Toolbar`.

## Acceptance criteria

- [ ] `updatePatioObjects(id, objects)` stub exists in `src/services/patios/api.ts` and updates the in-memory mock
- [ ] `updatePatioObjectsMutationOptions(id)` factory exists and invalidates the detail key on success
- [ ] `src/modules/PatioEditor/hooks/useAutosavePatio.ts` debounces 600ms and fires the mutation
- [ ] Initial mount does NOT trigger a save (only changes after first user action do)
- [ ] Object ids remain stable across saves (selection + undo history survive)
- [ ] Toolbar shows `Saving…` during in-flight mutation and `Saved` for ~2s after success
- [ ] Reload of `/patios/$id` shows previously placed objects (mock persistence in-session)
- [ ] `npm run tsc` and `npm run lint` clean

## Blocked by

- Blocked by `05-editor-context-and-add-from-catalog.issue.md`
