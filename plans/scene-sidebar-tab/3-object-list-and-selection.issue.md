## What to build

Populate `ScenePanel` with the live list of placed objects and wire two-way selection. Render
one row per object in array (insertion) order, newest at the bottom; each row shows a cube icon
and the object's `name`. Clicking a row selects that object (dispatch `select` with its id),
which drives the existing map silhouette, gizmo, and properties panel. The currently selected
object's row is visually highlighted. Because the map-pick path already sets `selectedId`,
selecting an object on the map highlights its row automatically; when `selectedId` changes, the
matching row is scrolled into view so it stays visible in a long list.

Verifiable end-to-end: placing objects fills the list; clicking a row selects on the map and
vice-versa; the selected row is highlighted and scrolled into view.

## Acceptance criteria

- [ ] `ScenePanel` renders one row per object in insertion order (newest last).
- [ ] Each row shows a cube icon and the object name.
- [ ] Clicking a row dispatches selection and shows the object's gizmo/properties.
- [ ] The selected object's row is highlighted.
- [ ] Selecting an object on the map highlights and scrolls its row into view.
- [ ] Empty state from slice 2 still shows when there are no objects.
- [ ] Type-check and lint pass.

## Blocked by

- Blocked by #1-object-names (rows need `name`)
- Blocked by #2-tabs-and-scenepanel-shell (needs the ScenePanel container)
