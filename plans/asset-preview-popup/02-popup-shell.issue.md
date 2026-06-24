# 02 — Popup shell: open/close + spawn

## What to build

Clicking a catalog asset opens a preview popup anchored to the right edge of the sidebar at a fixed position, replacing today's spawn-on-click. The popup's bottom section (name, `format - size`, orange Spawn Asset button) is fully functional; the top preview area is a dotted-background placeholder that issue #03 fills in.

End-to-end: select an asset → popup appears in a static spot → read its metadata → spawn it (closes popup) or dismiss it. Demoable on its own without any 3D rendering.

## Acceptance criteria

- [ ] Clicking a catalog item opens the popup and marks that item selected (highlight + chevron); it no longer dispatches `add` directly.
- [ ] Popup uses a non-modal Base UI Popover whose anchor is the sidebar container, `side="right"`, fixed top offset 186px — position is identical regardless of which item is clicked or scroll position.
- [ ] Resizing the sidebar keeps the popup anchored to its edge.
- [ ] Bottom section shows the model name, a `format - size` line (via `formatFileSize`), and an orange Spawn Asset button.
- [ ] Spawn Asset reuses the existing `EditorContext` `add` dispatch (center placement), then closes the popup and clears selection.
- [ ] Popup closes via X button, Escape, outside click, selecting another item (swaps content in place), switching to the Scene tab, or collapsing the sidebar.
- [ ] Selected/preview state is local to CatalogPanel (`selectedAssetId`).
- [ ] Top area renders the dotted-background placeholder (upload-flow pattern).
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-data-model-format-size
