# Scene Sidebar Tab

## Problem Statement

When editing a patio, a user places 3D objects onto the map, but the editor gives no
way to see everything that's in the scene as a list. To find a specific object the user
must hunt for it visually on the map and click it. There's also no way to remove an
object from the scene at all, and no quick way to recenter the camera on an object once
it has drifted off-screen. The "Scene" sidebar tab exists as a label but renders nothing.

## Solution

Make the "Scene" sidebar tab show a live list of every object placed in the current
patio. Each row names the object and is selectable — clicking a row selects that object
(showing its gizmo, silhouette, and properties panel) exactly as clicking it on the map
does, and selecting an object on the map highlights its row. Each row exposes an
overflow ("…") menu with two actions: **Zoom to Selected**, which flies the camera to
frame that object, and **Delete Object**, which removes it from the scene (undoable).
When the scene is empty, the tab shows a short hint pointing the user to the Assets tab.

## User Stories

1. As a patio editor, I want to switch the sidebar to a "Scene" tab, so that I can see what's currently in my scene instead of only the asset catalog.
2. As a patio editor, I want the Scene tab to list every object I've placed, so that I have a complete inventory of my scene in one place.
3. As a patio editor, I want each object in the list to have a readable name, so that I can tell objects apart without clicking each one.
4. As a patio editor, I want duplicate objects of the same model to get distinct names (e.g. "Anvil", "Anvil 2", "Anvil 3"), so that I can distinguish multiple copies.
5. As a patio editor, I want each object's name to stay stable after I delete a different object, so that names don't shuffle unexpectedly under me.
6. As a patio editor, I want to click a row to select that object, so that I can edit it via the properties panel without finding it on the map.
7. As a patio editor, I want the selected object's row to be visually highlighted, so that I always know which object I'm working on.
8. As a patio editor, I want selecting an object on the map to highlight its row in the list, so that the list and the map stay in sync.
9. As a patio editor, I want the list to scroll the selected row into view when I select an object on the map, so that I don't lose track of it in a long list.
10. As a patio editor, I want each row to reveal a "…" overflow menu on hover or when selected, so that per-object actions are available without cluttering every row.
11. As a patio editor, I want the "…" menu reachable by keyboard focus, so that I can operate the list without a mouse.
12. As a patio editor, I want a "Zoom to Selected" action in the row menu, so that I can recenter the camera on an object that has scrolled off-screen.
13. As a patio editor, I want "Zoom to Selected" to frame the object nicely regardless of its size, so that small and large objects are both usable after zooming.
14. As a patio editor, I want a "Delete Object" action in the row menu, so that I can remove objects I no longer want.
15. As a patio editor, I want deletion to happen immediately, so that I don't have to confirm a modal for every removal.
16. As a patio editor, I want a deleted object to be recoverable via undo, so that an accidental delete is not catastrophic.
17. As a patio editor, I want opening a row's menu to first select that row, so that the menu's actions unambiguously act on the object I clicked.
18. As a patio editor, I want the Scene tab to omit the search box, so that the list matches the intended design and isn't cluttered.
19. As a patio editor, I want the Assets tab to keep its search box and catalog, so that adding objects still works as before.
20. As a patio editor, I want newly added objects to appear at the bottom of the list, so that the list order is predictable and stable.
21. As a patio editor, I want an empty Scene tab to tell me how to add objects, so that I'm not staring at a blank panel.
22. As a patio editor, I want each row to show a cube icon next to the name, so that the rows read clearly as 3D objects.

## Implementation Decisions

### Data model
- Add a persisted `name: string` field to `PlacedObject`.
- The `add` reducer action generates the name from the placed model's display name: the
  first instance of a model keeps the bare model name; subsequent instances get a
  space-separated suffix (`Anvil`, `Anvil 2`, `Anvil 3`). The counter is monotonic —
  computed as one past the highest existing numeric suffix among objects sharing the same
  `modelId` — so deleting an earlier instance never causes a name collision or reshuffle.
- Name generation lives in a pure helper (model name + existing objects in, unique name
  out) so the reducer stays thin and the rule is isolated.
- Rename is not implemented; the field exists to enable it later.

### Sidebar / tabs
- The Sidebar gains controlled tab state and an `onValueChange` handler; the tabs become
  functional instead of hardcoded to "assets".
- The Scene tab renders a new `ScenePanel`. The Assets tab renders the existing search
  input plus `CatalogPanel`. The search input moves into the Assets branch — the Scene
  tab has no search box.

### ScenePanel
- Reads `objects` and `selectedId` from `EditorContext`; renders rows in array
  (insertion) order, newest at the bottom.
- Each row: cube icon + object name; a row click dispatches `select` with the object id.
- The currently selected object's row is highlighted.
- When `selectedId` changes (including via map pick), the matching row is scrolled into
  view.
- An overflow ("…") trigger appears on row hover, on the selected row, and on keyboard
  focus. Opening it selects that row first, then the menu actions operate on the
  selection.
- Empty state: a centered muted hint ("No objects in scene" / "Add from the Assets tab").

### Row menu
- Built on the project's Base UI `Menu` + `PopupWrapper` / `OptionItem` primitives,
  matching existing usages (ZoomControl, PatioSort).
- Two items, neither styled destructive/red:
  - **Zoom to Selected** (target icon).
  - **Delete Object** (trash icon) — dispatches `remove` immediately; recoverable via the
    existing undo history.

### Zoom-to-object
- Implemented geo-only: derive the object's world position from its `lng`/`lat`/`height`
  and fly the camera to a bounding sphere centered there, with a range scaled from the
  object's `scale`. It does not read the live glTF bounds, avoiding cross-component
  handle plumbing and the not-yet-loaded-model edge case.
- The camera fly logic is extracted into a small PatioEditor-scoped helper rather than
  importing the ViewCube-folder camera hook (which is folder-scoped and must not be
  imported from outside).

## Testing Decisions

No test runner is configured in this repo and the project convention is not to add one
unless asked, so this PRD ships without automated tests. The name-generation helper and
the fly-to-object helper are written as pure/isolated functions so they can be unit
tested later with no refactor if a runner is introduced.

## Out of Scope

- Renaming objects (the `name` field is added but no rename UI).
- Reordering / drag-to-sort the scene list.
- Grouping, nesting, or folder hierarchy of objects.
- Multi-select and bulk delete.
- Searching/filtering the Scene list.
- A delete confirmation dialog.
- Accurate glTF-bounds-based camera framing for zoom.
- Wiring or fixing the global undo keybinding (flagged as a dependency, handled separately).

## Further Notes

- Delete safety leans on undo being reachable (Ctrl/Cmd+Z). Verify the global undo
  keybinding is actually wired; if not, that's a separate gap to close.
- Figma references: Scene list `node-id=8862-66295`; expanded row menu `node-id=8583-22645`
  (menu component `8862-66514`, items "Zoom to Selected" + "Delete Object").
- Selection is already two-way capable: the map pick path sets `selectedId`, so the list
  highlight comes for free once rows read `selectedId`.
