# 04 — Update thumbnail: flash + optimistic cache

## What to build

A camera button in the preview action bar snapshots the current 3D view as the asset's thumbnail. Pressing it plays a camera-shutter flash, immediately swaps the sidebar thumbnail to the captured image, and uploads the new thumbnail in the background.

End-to-end: orbit to a nice angle → press update thumbnail → white flash → sidebar thumb updates instantly → upload persists it.

## Acceptance criteria

- [ ] Camera/update-thumbnail button rendered in the preview action bar.
- [ ] Pressing it captures the canvas (via the `onCapture` blob from #03) and triggers a brief white overlay flash that fades out over the preview.
- [ ] Captured thumbnail optimistically updates the model's `previewUrl` in the models list cache (`setQueryData`), so the sidebar thumb changes instantly.
- [ ] The blob uploads in the background via the existing `uploadModelThumbnail` mutation.
- [ ] Capture failure is non-blocking (popup stays usable).
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #03-3d-preview
