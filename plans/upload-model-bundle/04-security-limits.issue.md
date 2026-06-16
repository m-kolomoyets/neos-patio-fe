## What to build

Add resource and safety limits to bundle pre-processing so folder and zip inputs can't degrade or abuse the app. All failures surface through the existing error screen before the progress bar.

Limits:
- **Total size** — reuse the 250 MB cap, applied to the sum of `payloadFiles` (referenced-only; unreferenced junk doesn't count).
- **File count** — reject bundles exceeding ~500 files before building maps.
- **Path traversal** — the shared normalize function rejects `../` escapes and absolute paths (enforced for both folder and zip entries).
- **Zip inflate guard** — abort unzip if cumulative uncompressed size exceeds the cap (defends against zip bombs).

## Acceptance criteria

- [ ] A bundle whose referenced files exceed 250 MB total is rejected with a size error.
- [ ] A bundle exceeding the file-count cap is rejected.
- [ ] Entries with `../` escapes or absolute paths are rejected as invalid paths (folder and zip).
- [ ] A zip that inflates beyond the cap is aborted before exhausting memory.
- [ ] All limit errors appear on the error screen before any progress bar; retry reopens the picker.
- [ ] `tsc` and lint pass.

## Blocked by

- Blocked by #02-gltf-folder-dragdrop
- Blocked by #03-zip-input
