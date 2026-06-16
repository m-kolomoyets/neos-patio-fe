# Upload Model — glTF Bundle Support

## Problem Statement

Today the model upload flow accepts only a single self-contained file (`.glb` or a single `.gltf`). But real glTF assets are frequently distributed as a **bundle**: a `.gltf` JSON file that references external resources by relative URI — a `.bin` buffer and a `textures/` folder of images. When a user has such a bundle, they currently cannot upload it: dropping the loose `.gltf` alone fails because its `.bin` and textures are missing, and there is no way to select a whole folder. Users with Blender/Sketchfab-style exports are blocked.

## Solution

Extend the upload flow to accept glTF bundles through three normalized input paths, all converging on a single in-memory bundle representation:

1. **`.glb`** — single self-contained file (unchanged).
2. **`.gltf` + its folder** — dragged-and-dropped as a directory; the app walks the tree, finds the `.gltf`, and resolves its referenced `.bin`/textures from the dropped files.
3. **`.zip`** — a click-pickable archive that is unzipped in-browser into the same file tree.

The user sees the same multi-step flow as today (select → upload → preview → name/save). Behind the scenes the bundle is validated for completeness (all referenced files present), filtered to the minimum set of files actually needed, previewed live in the 3D canvas, and uploaded preserving relative paths so the backend can reconstruct the bundle.

## User Stories

1. As a user with a single `.glb` file, I want to upload it by clicking the upload button and picking the file, so that nothing about my existing workflow changes.
2. As a user with a `.glb` file, I want to drag-and-drop it onto the dropzone, so that I can upload without opening a file dialog.
3. As a user with a `.zip` of a glTF bundle, I want to click the upload button and pick the `.zip`, so that I can upload a multi-file model in one selection.
4. As a user with a glTF bundle as a loose folder, I want to drag-and-drop the folder onto the dropzone, so that I can upload it without zipping it first.
5. As a user, I want the dropzone to clearly state that it accepts a `.glb`, a `.gltf` folder, or a `.zip`, so that I know what I can drop.
6. As a user who dropped a `.gltf` bundle, I want the app to automatically find the right `.gltf` file inside the folder, so that I don't have to point at it manually.
7. As a user, I want the app to resolve my `.gltf`'s referenced `.bin` and texture files from the bundle, so that the model renders with its geometry and materials intact.
8. As a user whose bundle is nested inside a wrapping directory (e.g. `MyModel/scene.gltf`), I want paths resolved relative to the `.gltf`'s own folder, so that textures in subfolders still load.
9. As a user who dropped a folder with no `.gltf` or `.glb`, I want a clear error ("No .gltf or .glb found"), so that I understand why it was rejected.
10. As a user who dropped a folder with multiple models, I want a clear error telling me to upload one at a time, so that I know to split them.
11. As a user whose bundle is missing a referenced file (e.g. the `.bin`), I want a specific error naming the missing file, so that I can fix my export.
12. As a user, I want unreferenced junk in my folder (READMEs, `.blend`, `.DS_Store`, license files) to be ignored, so that only the files my model needs are uploaded.
13. As a user, I want a live 3D preview of my uploaded bundle exactly like single-file uploads, so that I can confirm it's the right model before saving.
14. As a user uploading a Draco-compressed model, I want it to preview and upload successfully, so that common compressed exports work.
15. As a user, I want the upload progress bar to reflect the real upload only (not file extraction/validation), so that progress is honest and never jumps backward into a rejection.
16. As a user, I want structural/validation errors to appear before the progress bar starts, so that I'm not confused by a moving bar that then fails.
17. As a user, I want a sensible default model name derived from my folder/zip name (falling back to the file name), so that I rarely have to retype it.
18. As a user, I want to retry after a validation/parse error and have the file picker reopen, so that I can choose a corrected bundle.
19. As a user, I want to retry after an upload failure and have my already-validated bundle re-uploaded, so that I don't repeat selection and validation.
20. As a user, I want my saved bundle to remain previewable for the rest of my session, so that the catalog tile works after saving.
21. As a user, I want oversized or abusive bundles rejected (too large, too many files, zip bombs, path-traversal entries), so that the app stays responsive and safe.
22. As a user who discards a bundle, I want its in-memory resources released, so that the app doesn't leak memory.
23. As a user, I want thumbnail capture and naming to work for bundles identically to single files, so that the save experience is consistent.

## Implementation Decisions

### Input normalization — `ModelBundle`

- All three inputs normalize to a single `ModelBundle` shape at the selection boundary, so the reducer, preview, and upload logic never branch on input kind:
  - `entry` — the chosen glTF file and its normalized path.
  - `files` — map of normalized relative path → `File` for every bundle file.
  - `payloadFiles` — the referenced-only subset of files, used for upload.
  - `blobUrls` — map of normalized relative path → object URL, used by the preview loader.
  - `kind` — `'glb'` or `'gltf-bundle'`.
- `.glb` collapses to a one-file bundle (single entry, single payload file, single blob URL).

### Selection UX

- **One** upload button → file picker accepting `.glb`, `.gltf`, `.zip` (single file, including zip).
- Folder upload is reachable via **drag-drop only** (`webkitGetAsEntry` directory walk). `webkitdirectory` and `accept` are mutually exclusive on one input; the single-button decision means folders have no click path by design.
- The dropzone branches on drop: directory entry → walk tree; single file → `.zip` vs `.glb`/`.gltf`.
- Dropping more than one top-level item is rejected.
- Copy: "Drop a .glb, .gltf folder, or .zip".

### Pre-processing pipeline (runs in the `selecting` state, before `uploading`)

Order of operations, any failure routing to the existing error screen *before* the progress bar appears:

1. Acquire a flat `{ path, file }[]`: directly for a single file; via `fflate` (lazy-imported, only when a `.zip` is selected) for archives; via recursive directory-entry walk for dropped folders.
2. Normalize + URL-decode every path through one shared function; reject `../` escapes and absolute paths as traversal errors.
3. Find the glTF entry: exactly one `.gltf` **or** `.glb`. Zero or multiple → reject.
4. Base directory = the entry's parent.
5. For `.gltf`: parse the JSON and collect referenced external URIs (`buffers[].uri`, `images[].uri`), skipping embedded `data:` URIs. `.glb` skips this step.
6. Pre-validate that every referenced file is present; a missing file produces a specific named error.
7. Build the `ModelBundle`: `payloadFiles` = referenced-only set; `blobUrls` = object URL per file.
8. Enforce limits (below).
9. On success, transition to `uploading`.

### Validation & limits

- Total size cap reuses the existing 250 MB limit, applied to the **sum of `payloadFiles`** (unreferenced junk does not count).
- File-count cap (≈500 files) before building maps.
- Zip inflate guard: abort if cumulative uncompressed size exceeds the cap (defends against zip bombs).
- Path normalization rejects traversal/absolute entries.

### Preview

- `GLTFLoader` drives the preview with a `LoadingManager.setURLModifier` that maps the loader's requested relative paths to the bundle's blob URLs. The loader is lazy — it only requests files the `.gltf` references — so the preview maps **all** files and lets the loader self-select.
- A `DRACOLoader` is attached (decoder lazy-loaded) for `KHR_draco_mesh_compression`.
- The parsed `gltf.scene` renders via the existing `<primitive>` path; thumbnail capture, fit-camera, and naming are unchanged.

### Upload contract (mock backend; real API TBD)

- Upload mutation contract becomes `{ entryPath, files: { path, file }[], signal, onProgress }`, sent as multipart `FormData` preserving relative paths. `.glb` is a one-element list.
- Mock returns `{ id }`. A `gltfUrl` field for server-reconstructed bundles is a follow-up.

### State & lifecycle

- `ModelBundle` replaces the prior `file` / `objectUrl` fields in the flow state.
- Displayed file size = sum of `payloadFiles` sizes.
- Default model name = root folder/zip name, falling back to the entry filename with its extension stripped.
- **Teardown:** revoke **all** `blobUrls` on discard/teardown. On **save**, keep blob URLs alive for the session so the saved catalog model remains previewable (session-only; server-URL persistence is deferred).
- Retry semantics preserved: structural/validation/parse errors clear the bundle and reopen the picker; upload failures retain the validated bundle and re-upload.

## Testing Decisions

This repo has **no test runner configured**, and project conventions say not to add one unless explicitly requested. No automated tests are introduced by this PRD.

Should testing be added later, the highest-value targets are the pure/near-pure deep modules, tested by external behavior (inputs → outputs), not internals:

- **Path normalizer** — decoding, `./`/`../` collapse, traversal/absolute rejection.
- **glTF ref extractor** — correct URI set from JSON; `data:` URIs skipped; nested-path handling.
- **Bundle builder** — entry selection (zero/one/multiple), missing-ref detection, payload filtering, limit enforcement — driven by synthetic `{ path, file }[]` fixtures.
- **Zip extractor adapter** — archive bytes → normalized file list, including zip-bomb guard.

Edge cases worth covering: nested wrapping directory, URL-encoded paths (`%20`), `../` in legitimate URIs that stays within base, mixed `.glb`+`.gltf` in one folder, embedded data-URI buffers/images, empty folder, oversized total, excessive file count.

## Out of Scope

- KTX2 (`KHR_texture_basisu`) and Meshopt (`EXT_meshopt_compression`) decoders — deferred follow-up.
- Server-side bundle persistence and the resulting `gltfUrl` (saved models are session-only blob URLs).
- A user-facing picker to choose among multiple `.gltf` files in one bundle (multi-model folders are rejected in v1).
- Moving heavy zip inflation to a web worker (v1 runs on the main thread).
- Scene-add (Cesium) loader configuration if it parses models independently of the preview.
- Automated tests / introducing a test runner.

## Further Notes

- The `LoadingManager.setURLModifier` approach is the canonical three.js pattern for in-memory bundles and keeps the `.glb` path effectively untouched.
- Because blob URLs have no path structure, relative-URI resolution is the central technical risk; the shared path-normalization function is used in three places (traversal validation, ref presence check, and the URL-modifier map) and must be consistent.
- `fflate` was chosen over `jszip` for size and speed and is lazy-imported so it stays out of the main bundle. Run the repo's npm-audit-install convention before adding it.
