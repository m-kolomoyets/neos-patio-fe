# PRD: Patio Editor — Delete Asset Confirm Dialog

## Problem Statement

In the Patio Editor asset catalog, opening an asset's preview popup exposes a "More actions" (⋯) menu with a **Delete** option. Today that option is a dead skeleton — it renders "Delete" text but does nothing. A user who wants to remove an asset from their catalog has no working path, and no safeguard against accidental deletion of a destructive, irreversible action.

## Solution

Clicking **Delete** in the asset preview popup's actions menu opens a confirmation dialog. The dialog shows the asset's thumbnail, a trash icon, and the question "Are you sure you want to delete this **{asset name}** asset?", with two choices: **No, Cancel** (dismiss) and **Yes, I'm sure** (confirm). Confirming removes the asset from the catalog; the dialog and the underlying preview popup both close. Canceling (button, X, or Esc) returns the user to the preview popup unchanged. The user cannot accidentally confirm by clicking outside the dialog.

## User Stories

1. As a patio editor user, I want a **Delete** option in the asset preview's ⋯ menu to actually respond, so that I can remove assets I no longer need.
2. As a patio editor user, I want a confirmation step before an asset is deleted, so that I don't lose an asset by an accidental click.
3. As a patio editor user, I want the confirmation dialog to show the asset's thumbnail and name, so that I can be certain I'm deleting the right asset.
4. As a patio editor user, I want a clear destructive-vs-safe visual distinction between the two buttons, so that I don't confuse cancel and confirm.
5. As a patio editor user, I want to cancel the deletion via a "No, Cancel" button, so that I can back out safely.
6. As a patio editor user, I want to cancel via the dialog's close (X) button, so that I have an obvious escape hatch.
7. As a patio editor user, I want to cancel via the Esc key, so that I can back out with the keyboard.
8. As a patio editor user, I want clicking outside the dialog to NOT dismiss it, so that a stray click near a destructive action doesn't do something unexpected.
9. As a patio editor user, I want the deleted asset to disappear from the catalog list immediately after confirming, so that the list reflects reality without a manual refresh.
10. As a patio editor user, I want the preview popup to close automatically once the asset is deleted, so that I'm not left inspecting an asset that no longer exists.
11. As a patio editor user, I want the buttons disabled while the deletion is in progress, so that I don't double-fire the action.
12. As a patio editor user, I want visual feedback (a loading state on the confirm button) while deletion is in flight, so that I know the app is working.
13. As a patio editor user, I want an error toast if the deletion fails, so that I understand it didn't work and can retry.
14. As a patio editor user, I want the dialog to stay open and re-enable its buttons after a failed deletion, so that I can retry without re-opening it.
15. As a patio editor user, I want assets I've already spawned into the scene to remain in place after I delete the catalog entry, so that deleting from the catalog doesn't wipe out my in-progress work.
16. As a patio editor user, I want the confirm dialog to visually match the rest of the editor (glass surface, thumbnail window, brand-orange confirm button), so that it feels native to the app.

## Implementation Decisions

**Architecture**
- The confirmation is a **separate centered `AlertDialog` overlay**, not an in-place swap inside the preview Popover. (Chosen over matching the Figma anchored-in-popup layout.) Content still faithfully replicates the Figma design inside the centered modal.
- Reuses the existing `AlertDialog` UI primitive (wraps `@base-ui/react/alert-dialog`), consistent with the discard-asset confirm in the upload flow.

**New module: `DeleteAssetDialog`** (co-located under the asset preview popup component folder; `index.tsx` + `styles.module.css` + `types.ts`)
- Interface (props): `model` (the asset, or null), `open` (boolean), `onOpenChange` (open setter).
- Deep-module responsibility: owns the entire delete interaction — the confirm mutation and the catalog cache update — behind a small, stable prop surface. Callers only supply which asset and whether the dialog is open.
- Owns the delete mutation via the existing `useDeleteModelMutation`.
- On success, removes the asset from the catalog list cache with an optimistic `queryClient.setQueryData(modelsKeys.list(), ...)` filter (mirrors the existing thumbnail-capture cache-write precedent). It does not use `invalidateQueries`.
- Content (top→bottom): thumbnail window rendering a static `<img>` of `model.previewUrl` + a close (X) button; separator; trash icon; title "Are you sure you want to delete this {model.name} asset?"; footer with **No, Cancel** (surface/glass variant, acts as dialog close) and **Yes, I'm sure** (brand/orange variant, triggers the mutation).
- Glass/surface styling matching the preview popup look.

**Modified module: `AssetPreviewPopup`**
- Adds local `deleteOpen` state.
- Wires the existing ⋯ menu's **Delete** item `onClick` to open the dialog (`setDeleteOpen(true)`); the menu closes itself.
- Renders `<DeleteAssetDialog model={model} open={deleteOpen} onOpenChange={setDeleteOpen} />`.
- No changes to `AssetPreviewPopupProps` — no new required props; the parent `CatalogPanel` is untouched.

**Behavior contract**
- Dismissal: "No, Cancel", close (X), and Esc all cancel and leave the asset intact. Outside/backdrop click does NOT dismiss (Base UI `AlertDialog` protective default).
- Success is silent (no success toast); the asset vanishing from the list is the feedback. Because removal drops the selected model, `CatalogPanel`'s derived `selectedModel` becomes null, which auto-closes the Popover — so dialog and popup close together with no explicit popup-close call.
- Pending: both buttons and the close X are disabled; the confirm button shows a loading state while `isPending`.
- Error: `toast.error(...)`, dialog stays open, buttons re-enable for retry.

**Scope of deletion**
- Catalog-entry removal only. Already-spawned scene instances persist: the objects layer keys its Cesium handles by placed-object id and retains the already-loaded glTF, so removing the catalog model neither destroys nor breaks existing placements. No scene cascade is performed.

## Testing Decisions

- **No automated test runner is configured in this repo** (per project conventions — no test framework, and one must not be introduced unless explicitly requested). Therefore no unit/integration tests are added for this feature.
- Verification is manual against the acceptance behavior below:
  - Delete menu item opens the dialog; dialog shows correct thumbnail + asset name.
  - "No, Cancel", X, and Esc each dismiss without deleting; outside click does not dismiss.
  - "Yes, I'm sure" removes the asset from the catalog list and closes both dialog and popup.
  - Buttons disable + confirm shows loading during the mock delay; double-click cannot double-fire.
  - Simulated failure shows an error toast and keeps the dialog open with re-enabled buttons.
  - A previously spawned instance of the deleted asset remains in the scene.
- Type safety and lint are the enforced gates: `npm run tsc` and `npm run lint` must pass.

## Out of Scope

- Any change to the anchored-in-popup layout from Figma (explicitly replaced by a centered AlertDialog).
- Removing/cleaning up already-spawned scene instances of a deleted asset (they persist by design).
- Real backend deletion — the `deleteModel` API is a mock; no server contract changes.
- Bulk delete / multi-select deletion.
- Undo / restore of a deleted asset.
- Success toast or any post-delete notification beyond the item disappearing.
- Changes to `CatalogPanel`, the models service API surface, or query keys.

## Further Notes

- The delete mutation, cache-write pattern (`setQueryData` on `modelsKeys.list()`), and the `AlertDialog` primitive all already exist in the codebase; this feature is primarily wiring plus one new presentational-with-mutation component.
- Button variants map to existing tokens: surface (glass) for cancel, brand (orange `#d1703b`) for confirm — no new design tokens.
- Icons reused: `trash_24` (dialog body), `close_24` (dialog X) — already imported elsewhere in the popup.
