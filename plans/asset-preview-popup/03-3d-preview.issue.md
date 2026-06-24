# 03 — 3D preview integration

## What to build

Fill the popup's top area with an interactive 3D preview of the model on the dotted background. Promote the existing `ModelPreviewScene` from the upload flow into a shared component, decouple it from the upload context, and teach it to load a model from a URL (the catalog provides `gltfUrl`, not a parsed glTF).

End-to-end: open the popup → model downloads (skeleton shown) → renders centered and orbit/zoomable → play/pause appears only for animated models → a load failure shows a graceful fallback without blocking spawn.

## Acceptance criteria

- [ ] `ModelPreviewScene` moved to a shared location under `src/components`; the upload flow still works using it.
- [ ] Component no longer imports `UploadModelContext`; thumbnail capture is surfaced via an `onCapture?(blob)` callback prop. Upload flow passes its own handler.
- [ ] A URL-loading wrapper (drei `useGLTF` + Suspense) renders the model from `gltfUrl`; the existing parsed-`gltf` path is preserved for the upload flow.
- [ ] Preview sits on the dotted background, supports orbit + zoom (no pan), and centers/fits the model.
- [ ] Loading shows a skeleton/spinner over the dotted background.
- [ ] Load failure shows a compact "Preview unavailable" state; name/size and Spawn Asset remain usable.
- [ ] Play/pause control appears only when the model has animation clips and plays/pauses the first clip.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #02-popup-shell
