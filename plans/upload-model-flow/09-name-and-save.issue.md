## What to build

Naming and saving the asset. The preview step has a name `Input` defaulted to the filename without
extension, required for Save. On Save: upload the thumbnail Blob via `uploadModelThumbnail`, append
the finished `Model3D` to the list query via `setQueryData` (object URLs as `gltfUrl`/`previewUrl`),
close the dialog, and show a success toast. The sidebar item becomes a real saved asset.

## Acceptance criteria

- [ ] Name input defaults to filename (no extension), editable
- [ ] Save disabled while name is empty
- [ ] Save calls `uploadModelThumbnail(id, blob)`
- [ ] Save appends the finished `Model3D` via `queryClient.setQueryData(modelsKeys.list(), ...)` (no refetch)
- [ ] Saved asset appears in the Assets list with its thumbnail; dialog closes
- [ ] Success toast shown on save
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #01-toast-primitive
- Blocked by #06-preview-scene
- Blocked by #07-thumbnail-capture
