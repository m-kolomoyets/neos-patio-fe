## What to build

End-to-end support for uploading a loose `.gltf` bundle by dragging its folder onto the dropzone. The full path: walk the dropped directory tree, normalize every file path, find the single glTF entry, parse it for referenced resources, validate they're all present, build a `ModelBundle`, preview it live in the 3D canvas (external `.bin`/textures resolved through the loader), and upload the referenced files preserving relative paths.

Pre-processing runs in the `selecting` state, before the `uploading` transition, so any structural/validation error lands on the error screen before the progress bar appears.

Pipeline:
1. Drop handler detects a directory entry and recursively walks it into a flat `{ path, file }[]`. Dropping more than one top-level item is rejected.
2. A shared path-normalize function decodes URL-encoding and collapses `./`/`../`; traversal/absolute paths are rejected.
3. Find the glTF entry: exactly one `.gltf` or `.glb`. Zero → "No .gltf or .glb found"; multiple → "upload one at a time".
4. Base directory = entry's parent.
5. Parse the `.gltf` JSON → collect referenced external URIs (`buffers[].uri`, `images[].uri`), skipping `data:` URIs.
6. Pre-validate every referenced file is present; a missing one yields a specific named error.
7. Build the bundle: `payloadFiles` = referenced-only; `blobUrls` = object URL per file.
8. Preview via `GLTFLoader` + `LoadingManager.setURLModifier` mapping requested relative paths → blob URLs (map all files; loader self-selects).
9. Upload `payloadFiles` via the slice-1 `FormData` contract.

Also in this slice: default model name = root folder name (fallback to entry filename, extension stripped); dropzone copy "Drop a .glb, .gltf folder, or .zip"; save keeps blob URLs alive for the session while discard revokes all.

## Acceptance criteria

- [ ] Dragging a `.gltf` bundle folder uploads and previews with geometry and textures intact.
- [ ] Nested wrapping directory (e.g. `MyModel/scene.gltf`) resolves textures in subfolders correctly.
- [ ] Folder with no glTF → clear "no .gltf/.glb" error; folder with multiple models → "upload one at a time" error.
- [ ] Missing referenced file → specific error naming the file, shown before the progress bar.
- [ ] Unreferenced junk files (READMEs, `.DS_Store`, etc.) are excluded from `payloadFiles` and not uploaded.
- [ ] Default name derives from the folder name, fallback to entry filename.
- [ ] Dropzone hint updated; dropping >1 top-level item rejected.
- [ ] Save keeps the bundle previewable for the session; discard revokes all blob URLs.
- [ ] Upload sends referenced files with correct relative paths; progress/abort work.
- [ ] `tsc` and lint pass.

## Blocked by

- Blocked by #01-model-bundle-foundation
