## What to build

Introduce a single `ModelBundle` abstraction and route the existing single-file upload path (`.glb` and single `.gltf`) through it, with no user-visible behavior change. This is the foundational tracer: it threads the new shape through every layer — selection, flow state, preview loader, and the upload mutation contract — so later bundle work has one shared representation to plug into.

A `ModelBundle` carries:
- `entry` — the chosen glTF file and its normalized relative path.
- `files` — map of normalized relative path → `File` for every bundle file.
- `payloadFiles` — the referenced-only subset used for upload.
- `blobUrls` — map of normalized relative path → object URL for the preview loader.
- `kind` — `'glb' | 'gltf-bundle'`.

A single file collapses to a one-file bundle (single entry, single payload file, single blob URL). The flow state's prior `file` / `objectUrl` fields are replaced by `bundle`. The upload mutation contract becomes `{ entryPath, files: { path, file }[], signal, onProgress }` sent as multipart `FormData`; the single-file case is a one-element list. The mock backend still returns `{ id }`.

## Acceptance criteria

- [ ] `ModelBundle` type defined; single-file selection (both `.glb` and single `.gltf`) normalizes into it at the selection boundary.
- [ ] Flow state uses `bundle` in place of `file`/`objectUrl`; reducer, preview, naming, thumbnail, and discard all consume the bundle.
- [ ] Preview renders the single-file model exactly as before.
- [ ] Displayed file size = sum of `payloadFiles` sizes (equals the single file's size here).
- [ ] Upload mutation accepts `{ entryPath, files, signal, onProgress }`; single file sent as a one-element `FormData` list; progress and abort still work.
- [ ] Discard/teardown revokes all `blobUrls`.
- [ ] Existing single-file upload → preview → name → save → catalog flow regresses cleanly; `tsc` and lint pass.

## Blocked by

- None - can start immediately
