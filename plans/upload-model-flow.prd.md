# Upload Model Flow — PRD

## Problem Statement

A patio editor user has their own 3D models (`.glb` / `.gltf`) they want to bring into a
patio. Today the Assets sidebar only lists pre-seeded fixtures — there is no way to upload a
custom model, see what it looks like, give it a thumbnail, or get feedback that the upload
worked or failed. The app also fires error toasts internally (`@queryClient.ts`) but no toast
surface is mounted, so users never see them.

## Solution

From the Assets sidebar, the user clicks **Upload Assets** and is guided through a dialog flow:
pick a file (validated for type and size), watch an upload progress bar, then land on an
interactive 3D preview where they can rotate the model, capture a thumbnail from the camera,
play any embedded animation, name the asset, and save it. While uploading, a placeholder item
appears in the sidebar with the live progress and is replaced by the captured thumbnail once
ready. Saving adds the asset to the list and shows a success toast; discarding asks for
confirmation, then cancels/cleans everything up. Operational failures surface as toasts.

## User Stories

1. As a patio editor user, I want an **Upload Assets** entry in the Assets sidebar, so that I can start importing my own model.
2. As a user, I want to pick a file by browsing or drag-and-drop, so that uploading is fast and familiar.
3. As a user, I want only `.glb` and `.gltf` files accepted, so that I can't upload unsupported formats by mistake.
4. As a user, I want files over 250MB rejected, so that I don't wait on an upload that won't be allowed.
5. As a user, I want validation errors shown inline in the picker, so that I immediately understand why a file was refused.
6. As a user, I want a progress bar while the model uploads, so that I know it's working and how far along it is.
7. As a user, I want the model to load locally in parallel with the upload, so that the preview is ready as soon as the upload finishes.
8. As a user, I want the preview shown only after the upload API succeeds, so that I never see a preview for an asset that didn't persist.
9. As a user, I want a placeholder item to appear in the Assets sidebar as soon as upload starts, so that I can see the new asset taking shape in context.
10. As a user, I want that sidebar item to show the same live progress as the dialog, so that the two stay consistent.
11. As a user, I want the sidebar item to swap to the captured thumbnail when the preview is ready, so that it looks like a real asset.
12. As a user, I want to rotate the model in a 3D scene, so that I can inspect it and frame a good thumbnail.
13. As a user, I want a default thumbnail captured automatically when the preview opens, so that a thumbnail always exists even if I do nothing.
14. As a user, I want a button to re-capture the thumbnail from the current camera angle, so that I can choose the framing I like.
15. As a user, I want a Play button when the model has animations, so that I can see it animate.
16. As a user, I want the animation to play once and hold its final pose, so that playback is predictable.
17. As a user, I want Play to become Pause while animating, so that I can freeze and resume.
18. As a user, I want no animation control shown when the model has no animations, so that the UI isn't misleading.
19. As a user, I want to name the asset (defaulted from the filename), so that I can find it later.
20. As a user, I want Save disabled until the asset has a name, so that I don't create unnamed assets.
21. As a user, I want a success toast after saving, so that I get clear confirmation.
22. As a user, I want the saved asset to appear in the Assets list, so that I can use it immediately.
23. As a user, I want closing the dialog mid-flow to ask for confirmation, so that I don't lose work by accident.
24. As a user, I want a pristine picker (nothing selected yet) to close without a confirmation prompt, so that I'm not nagged needlessly.
25. As a user, I want confirming the discard to cancel the in-flight upload, delete anything already created, remove the sidebar placeholder, and clear the dialog, so that nothing is left dangling.
26. As a user, I want an error toast and a Retry option if the upload API fails, so that I can recover without restarting.
27. As a user, I want to be sent back to the picker with an inline error if the model can't be parsed, so that I can choose a different file.
28. As a user, I want thumbnail/delete failures to toast without blocking me, so that minor failures don't derail the flow.
29. As an app user anywhere, I want toasts to actually render, so that success and error feedback reaches me.

## Implementation Decisions

### Modules to build / modify

- **`UploadModelFlow` sub-module** (under `PatioEditor`): owns the dialog, the step UI
  (`selecting → uploading → error → preview`), and orchestrates the flow. Takes no props
  (module convention).
- **`UploadModelProvider` context** at the `PatioEditor` root: the single source of truth for the
  active upload. Holds `File`, status (discriminated union: `idle | selecting | uploading | error | preview`),
  progress %, parsed model / object URL, thumbnail `Blob` (+ derived object URL), name, and the
  issued model id. Exposes actions (start, retry, recapture thumbnail, save, discard). Supports
  **one active upload at a time**. Consumed by both the dialog and the sidebar.
- **Sidebar Assets list** (existing `Sidebar` / `CatalogPanel`): add the **Upload Assets** trigger
  and render a transient pending item driven by the provider (progress → thumbnail).
- **`ModelPreviewScene`** (inside the flow): standalone R3F `<Canvas>` with
  `gl={{ preserveDrawingBuffer: true }}`, `OrbitControls`, drei `<Stage>` / local lights
  (no remote `<Environment>` HDR), auto-framing, thumbnail capture, and animation playback
  via drei `useAnimations` (first clip, `LoopOnce` + `clampWhenFinished`).
- **`ui/ProgressBar`** (new global primitive): wraps Base UI `Progress`; determinate, `value` 0–100,
  tokenized; reused in the dialog and the sidebar pending item.
- **`ui/Toast`** (new global primitive): wraps Base UI `Toast`. Mounted once in `main.tsx`.
  Exposes a `createToastManager`-based imperative API. **Remove `sonner`**; replace the two
  `toast.error` calls in `@queryClient.ts`.
- **`services/models`** (extend): mock mutations
  - `uploadModel(file, { onProgress, signal }): Promise<{ id }>` — timer-driven 0→100 progress, abortable.
  - `deleteModel(id): Promise<void>` — mock.
  - `uploadModelThumbnail(id, blob): Promise<void>` — mock, called on Save.
  - Each wrapped in `mutationOptions` factories + thin `useXxxMutation` hooks; progress stays a callback.

### Flow / behavioral decisions

- Two parallel tracks once a file is chosen: (A) local `URL.createObjectURL` + glTF parse for the
  scene; (B) mock `uploadModel`. The progress bar reflects **track B**. Preview is gated on **both**
  parse success and API success.
- **Thumbnail:** captured via `canvas.toBlob()`, downscaled to a 256×256 square on an offscreen
  canvas, stored as a `Blob` (object URL derived for rendering). Auto-captured once on entering
  Preview (default), re-capturable by button. Object URLs revoked on teardown.
- **Name:** defaults to filename without extension, editable via `Input`, required for Save.
- **Save:** `queryClient.setQueryData(modelsKeys.list(), append)` to add the finished `Model3D`
  (object URLs as `gltfUrl` / `previewUrl`); no refetch (fixtures don't include it). Success toast.
- **Discard:** confirmation only when the flow is **dirty** (file selected / upload started /
  uploaded); pristine picker closes directly. On confirm: abort in-flight upload, `deleteModel(id)`
  if an id was issued, remove the sidebar placeholder, revoke object URLs, reset to `idle`.
- **Error recovery:** upload API failure → in-dialog error state with **Retry** (same file) + Discard
  + error toast; parse failure → back to `selecting` with inline error + error toast;
  thumbnail/delete failures → toast only, non-blocking (thumbnail falls back to default capture).
- **Toasts:** success on Save; errors on upload / parse / thumbnail / delete; validation errors
  stay inline in the picker.
- **Confirmation dialog:** Base UI `AlertDialog` for the discard confirm.

### Contracts

- `Model3D` stays `{ id, name, gltfUrl, previewUrl }`; the uploaded asset populates these with
  object URLs client-side.
- Validation: extensions `.glb` / `.gltf`, max size 250MB. `.glb` is the happy path; a `.gltf`
  referencing external assets may fail to parse and routes to the parse-error path. No multi-file
  / folder upload.

## Testing Decisions

No test runner is configured in this repo (per CLAUDE.md, don't add one). Verification is manual:

- Type-check (`npm run tsc`) and lint (`npm run lint`) must pass.
- Manual smoke of the flow in `npm run dev`: pick a `.glb` with animations and one without; oversize
  and wrong-type rejection; progress sync between dialog and sidebar; default + re-captured thumbnail;
  play/pause once-through; Save appends to the list and toasts; discard at each step cleans up;
  simulated upload failure → Retry; parse failure → back to picker.

Good test targets **if** a runner is later introduced (test external behavior, not internals):
the upload state machine (transitions, dirty detection, teardown ordering), validation predicate
(extension + size), and the thumbnail downscale util. These are the deep, pure modules worth
isolating.

## Out of Scope

- Real backend upload/delete/thumbnail persistence (all mocked).
- Multi-file / folder `.gltf` upload (external `.bin` + textures).
- Concurrent / queued uploads (single active upload only).
- Animation clip selection / multiple simultaneous clips (first clip only).
- Remote HDR environments / advanced PBR lighting in the preview.
- Editing or re-thumbnailing assets already saved in the list.
- Placing the uploaded model into the actual patio scene (separate flow).

## Further Notes

- Entry point confirmed in Figma: **Upload Assets** button at the bottom of the left sidebar's
  Assets tab (`node 7245-90238`). Individual dialog frames to be pulled per-step at build time.
- The preview `<Canvas>` is standalone and separate from the existing `MapCanvas` R3F usage.
- `sonner` is currently the only toast lib and is referenced solely in `@queryClient.ts`; removing
  it requires updating that file in the same change that introduces `ui/Toast`.
