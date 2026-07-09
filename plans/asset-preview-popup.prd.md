# Asset Preview Popup — PRD

## Problem Statement

In the Patio Editor, a user browsing the Assets tab can only see a small thumbnail and a name for each 3D model. Clicking an asset immediately drops it into the scene — there is no way to inspect the model first (rotate it, check its format/size, confirm it's the right one, or refresh its thumbnail). Users spawn the wrong assets, can't preview animations, and have no per-asset actions (share link, update thumbnail, delete).

## Solution

Clicking an asset in the catalog opens a preview popup anchored to the right edge of the sidebar at a fixed position. The popup has two parts:

- **Top** — an interactive 3D preview of the model (orbit/zoom) on the same dotted background used by the upload flow, with an action bar: play animation (when the model has one), update thumbnail (with a camera-flash effect that refreshes the sidebar thumb), copy link (with a copied checkmark state), and a dots menu (Delete, reserved for future).
- **Bottom** — the model name, its format and size (e.g. `glTF - 120 MB`), and an orange **Spawn Asset** button that adds the model to the scene.

The popup replaces spawn-on-click: clicking an item now inspects it; spawning is an explicit button. This gives users a confident "look before you place" step plus lightweight asset management.

## User Stories

1. As an editor user, I want clicking an asset in the catalog to open a preview popup, so that I can inspect a model before placing it.
2. As an editor user, I want the popup to appear at a fixed position next to the sidebar regardless of which asset I clicked or how far I scrolled, so that the preview is always in the same predictable place.
3. As an editor user, I want the popup to stay anchored to the sidebar when I resize the sidebar, so that it never overlaps or detaches from the list.
4. As an editor user, I want the clicked asset highlighted in the list (with a chevron), so that I know which asset the popup is showing.
5. As an editor user, I want to orbit and zoom the 3D model in the preview, so that I can examine it from any angle.
6. As an editor user, I want the preview to sit on the same dotted background as the upload preview, so that the experience feels consistent.
7. As an editor user, I want a loading indicator while the model downloads, so that I know the preview is working.
8. As an editor user, I want a clear "preview unavailable" state if the model fails to load, while still being able to read its name/size and spawn it, so that one bad preview doesn't block me.
9. As an editor user, I want a play/pause button that appears only when the model has an animation, so that I can preview motion without clutter on static models.
10. As an editor user, I want an "update thumbnail" button that snapshots the current preview view, so that the sidebar thumbnail reflects the angle I want.
11. As an editor user, I want a camera-flash effect when I update the thumbnail, so that I get clear feedback that a photo was taken.
12. As an editor user, I want the sidebar thumbnail to update immediately when I capture a new one, so that I see the result without waiting for the upload.
13. As an editor user, I want the new thumbnail uploaded in the background, so that it persists for future sessions.
14. As an editor user, I want a copy-link button that copies the model's file URL, so that I can share the asset.
15. As an editor user, I want the copy button to show a checkmark for a couple of seconds after copying, so that I know the copy succeeded.
16. As an editor user, I want a dots menu with a Delete option visible (but disabled for now), so that I understand future capability without it being functional yet.
17. As an editor user, I want to see the model's name, format, and size in MB, so that I can judge whether it fits my needs.
18. As an editor user, I want an explicit Spawn Asset button, so that placing a model is a deliberate action, not an accidental click.
19. As an editor user, I want the popup to close after I spawn an asset, so that I return to browsing without an extra step.
20. As an editor user, I want to close the popup with an X button, so that I can dismiss it directly.
21. As an editor user, I want to close the popup with Escape, so that I can dismiss it from the keyboard.
22. As an editor user, I want to close the popup by clicking outside it, so that dismissing feels natural.
23. As an editor user, I want clicking a different asset to swap the popup content in place, so that I can compare assets quickly.
24. As an editor user, I want the popup to close when I switch to the Scene tab or collapse the sidebar, so that it never floats detached from its anchor.

## Implementation Decisions

### Data model

- Extend the `Model3D` type and the mock models API to include `format` (string, e.g. `glTF`) and `sizeBytes` (number). These are backend-provided fields.
- The animation flag is **not** a stored field; it is derived at runtime from the loaded glTF's animation clips (the preview scene already parses the model).
- Format is shown verbatim; size is computed `sizeBytes → MB`, rounded, via a small `formatFileSize` helper colocated with the popup.

### Positioning / anchoring

- Use Base UI `Popover` (`@base-ui/react/popover`), controlled `open`, **non-modal**, dismiss-on-outside-press enabled.
- The Popover **anchor** is the sidebar container element (not the clicked list item). `side="right"` with a **fixed top offset of 186px**, so the popup is static regardless of which item is clicked or scroll position. It tracks the sidebar's size, so resizing the sidebar keeps it anchored.
- Trigger is decoupled from the anchor: opening is driven by list-item click state, not by a Popover trigger element wrapping each item.

### State

- Selected/preview state is local to the CatalogPanel: `selectedAssetId | null`. CatalogPanel owns both the list and the popup. The sidebar container ref is plumbed to the Popover positioner's anchor.
- Switching the sidebar tab away from Assets or collapsing the sidebar clears selection and closes the popup.

### Click behavior change

- List-item click no longer dispatches `add` (spawn). It opens the popup and marks the item selected (highlight + chevron).
- Spawning happens only via the Spawn Asset button, which reuses the existing `EditorContext` `add` dispatch (center placement via `pickGroundPoint`). After dispatch, the popup closes and selection clears.

### 3D preview module (deep module)

- Promote the existing `ModelPreviewScene` (Three.js + react-three-fiber + drei `OrbitControls`/`useAnimations`/`Center`, one-shot `FitCamera`, `CaptureBridge`) from inside `UploadModelFlow/components` to a **shared** location under `src/components`, since it carries business logic (glTF parsing, animation, canvas snapshot).
- **Decouple it from `UploadModelContext`**: replace the internal `captureThumbnail(blob)` call with an `onCapture?(blob)` callback prop, so each consumer decides what to do with the captured blob. The upload flow passes its context handler; the popup passes its own.
- The component currently accepts an already-parsed `gltf: GLTF`. Add a URL-loading wrapper (drei `useGLTF` + `Suspense`) for the popup, since the catalog provides a `gltfUrl`, not a parsed model. The upload flow's parsed-glTF path is preserved.
- Keep `preserveDrawingBuffer` for snapshotting and the existing play/pause overlay (which already gates on `gltf.animations.length`).

### Action bar

- **Play/pause** — existing overlay, shown only when the model has clips.
- **Update thumbnail** — capture canvas → trigger a white overlay flash that fades out → optimistically `setQueryData(modelsKeys.list())` swapping that model's `previewUrl` to a local object URL → fire `useUploadModelThumbnailMutation(id, blob)` in the background. Sidebar thumb updates instantly.
- **Copy link** — copy `gltfUrl` to the clipboard via `navigator.clipboard.writeText`; swap the button icon to a checkmark for ~2s (local state, no toast).
- **Dots menu** — a Base UI Menu with a single `Delete` item rendered **disabled** (future). No Menu wrapper exists in `src/components/ui` yet; either add a thin `Menu` ui wrapper following the Button/Tabs pattern or use `@base-ui/react/menu` directly.

### Bottom section

- Name, the `format - size` line, and an orange Spawn Asset button (existing Button variant).

### Loading / error

- Suspense skeleton/spinner over the dotted background while the model loads.
- On load failure, show a compact "Preview unavailable" state while keeping name/size and the Spawn Asset button usable.

### Layering compliance

- Popup lives as a sub-component of CatalogPanel (`CatalogPanel/components/AssetPreviewPopup`), respecting routes → modules → components/ui rules.
- The promoted `ModelPreviewScene` and any new `Menu` primitive land in `src/components` / `src/components/ui` respectively.

## Testing Decisions

- This repo has **no test runner configured** (per CLAUDE.md, tests are not to be added unless explicitly requested). No automated tests are introduced as part of this PRD.
- Validation is via `npm run tsc` (type-check) and `npm run lint` (eslint + stylelint + prettier), which must pass.
- A good test here would exercise **external behavior** rather than internals — e.g. "clicking an item opens the popup with the correct name/size", "Spawn closes the popup and adds one object", "copy shows the checkmark then reverts", "play button is absent for a static model" — not the camera-fit math or R3F wiring.
- If a test runner is added later, the highest-value, most isolatable targets are: `formatFileSize` (pure), the optimistic thumbnail cache update (queryClient behavior), and the decoupled `ModelPreviewScene` capture callback. These are the deep, stable-interface modules.

## Out of Scope

- **Delete** functionality — the menu item is present but disabled; no `deleteModel` wiring, confirmation dialog, or cache removal in this PRD.
- Multi-spawn from a single open (popup closes after one spawn).
- Drag-to-place / custom placement — spawn uses existing center placement.
- Real backend for `format`/`sizeBytes` (mock API fields only) and any server-side thumbnail processing beyond the existing upload mutation.
- Deep-link/app URLs for sharing — copy uses the raw `gltfUrl`.
- Editing model metadata (rename, re-categorize) from the popup.
- Keyboard-driven list navigation of assets.

## Further Notes

- The white "photo flash" is a brief white overlay over the preview canvas that fades out (CSS or framer-motion), mimicking a camera shutter — no scale/shutter pulse.
- The dotted background reuses the upload flow's pattern: `radial-gradient(hsl(var(--color-hsl-white)/0.08) 1px, transparent 1px)` at `16px` with the dark surface fill.
- Non-modal Popover with outside-press dismissal is intentional so the scene/sidebar underneath stay interactive while the popup is open; switching tab/collapsing the sidebar must explicitly close it because the anchor would otherwise move or disappear.
- Confirm during build: exact plumbing of the sidebar container ref to the Popover anchor (CatalogPanel sits inside the Sidebar; the ref may need to come from the Sidebar layer).
