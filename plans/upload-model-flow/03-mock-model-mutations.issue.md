## What to build

Mock upload/delete/thumbnail mutations in the `models` service, following the repo's
`mutationOptions` + thin hook convention. Upload simulates progress over time and is
cancellable; delete and thumbnail are simple mock resolves.

## Acceptance criteria

- [ ] `uploadModel(file, { onProgress, signal })` resolves with `{ id }`, drives `onProgress` 0→100 over a simulated duration, and rejects/aborts on `signal`
- [ ] `deleteModel(id)` mock resolves
- [ ] `uploadModelThumbnail(id, blob)` mock resolves
- [ ] Each wrapped in a `mutationOptions` factory + thin `useXxxMutation` hook
- [ ] Progress delivered via callback (not query state); abort path is reachable
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

None - can start immediately
