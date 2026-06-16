## What to build

The upload provider and uploading step. On a valid file, `UploadModelProvider` (mounted at the
PatioEditor root) starts two parallel tracks: local `createObjectURL` + glTF parse, and the mock
`uploadModel` with progress. The dialog shows the ProgressBar (API track); a transient placeholder
item appears in the sidebar Assets list driven by the same provider state, showing the live
progress. When both the parse and the API upload succeed, the flow transitions to `preview`.

## Acceptance criteria

- [ ] `UploadModelProvider` holds the discriminated-union state (`idle|selecting|uploading|error|preview`), file, progress, parsed model/object URL, issued id; one active upload only
- [ ] Starting upload runs local parse ∥ `uploadModel`; progress bar reflects the API track
- [ ] Transient sidebar item appears on upload start and shows the same progress as the dialog
- [ ] Transition to `preview` happens only after both parse and API succeed
- [ ] Provider consumed by both dialog and sidebar (no duplicated state)
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #02-progressbar-primitive
- Blocked by #03-mock-model-mutations
- Blocked by #04-upload-entry-file-picker
