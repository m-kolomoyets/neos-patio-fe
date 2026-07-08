## What to build

Wire the dead **Delete** option in the asset preview popup's ⋯ menu to a working confirmation flow, end-to-end.

Add a new co-located `DeleteAssetDialog` component (under the asset preview popup folder) that wraps the existing `AlertDialog` UI primitive. It renders the asset thumbnail (static `<img>` of `model.previewUrl`) with a close (X) button, a separator, a trash icon, the title "Are you sure you want to delete this {model.name} asset?", and a footer with **No, Cancel** (surface/glass variant) and **Yes, I'm sure** (brand/orange variant). Styling matches the preview popup's glass surface.

`AssetPreviewPopup` gains local `deleteOpen` state; the ⋯ menu's Delete item opens the dialog. Confirming runs the existing `useDeleteModelMutation` and, on success, removes the asset from the catalog list cache via `queryClient.setQueryData(modelsKeys.list(), ...)`. Because the model leaves the list, `CatalogPanel`'s derived `selectedModel` becomes null and the Popover auto-closes — so dialog and popup close together with no explicit close call.

No changes to `AssetPreviewPopupProps` or `CatalogPanel`.

## Acceptance criteria

- [ ] `DeleteAssetDialog` component exists co-located under the asset preview popup folder (`index.tsx` + `styles.module.css` + `types.ts`), props: `model`, `open`, `onOpenChange`.
- [ ] Clicking ⋯ → **Delete** opens the dialog; the menu closes.
- [ ] Dialog shows the correct asset thumbnail (`previewUrl`) and name interpolated into the title.
- [ ] Buttons: **No, Cancel** (surface variant) dismisses; **Yes, I'm sure** (brand variant) confirms.
- [ ] Confirm runs `useDeleteModelMutation` and removes the asset from `modelsKeys.list()` cache via `setQueryData` (not `invalidateQueries`).
- [ ] On success the deleted asset disappears from the catalog list and both dialog and preview popup close.
- [ ] A previously spawned scene instance of the deleted asset remains in place (verify-only; no scene cleanup performed).
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
