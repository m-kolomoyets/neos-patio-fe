## What to build

Accept a `.zip` archive of a glTF bundle through the existing single upload button (file picker accepting `.glb`, `.gltf`, `.zip`) and via drag-drop of a `.zip` file. When a `.zip` is selected, lazy-import `fflate`, unzip it into the same flat `{ path, file }[]` shape that the folder walk produces, then run the identical slice-2 pipeline (normalize → find entry → extract refs → validate → build bundle → preview → upload).

`fflate` is dynamically imported only on the `.zip` path so it stays out of the main bundle.

## Acceptance criteria

- [ ] Clicking the upload button and picking a `.zip` of a glTF bundle uploads and previews correctly.
- [ ] Dragging a `.zip` file onto the dropzone works identically.
- [ ] Unzipped entries flow through the same normalize/find-entry/validate/build pipeline as folder uploads (zero/multi/missing-ref errors behave the same).
- [ ] `fflate` is lazy-imported (absent from the main chunk; loaded only when a `.zip` is chosen).
- [ ] A `.zip` wrapping the bundle in an inner directory resolves correctly.
- [ ] `tsc` and lint pass; `fflate` added per the repo's npm-audit-install convention.

## Blocked by

- Blocked by #02-gltf-folder-dragdrop
