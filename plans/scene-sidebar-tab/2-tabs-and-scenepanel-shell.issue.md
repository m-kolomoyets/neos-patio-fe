## What to build

Make the sidebar's Scene/Assets tabs actually switch, and render the Scene tab's container.
Today the tabs are hardcoded to "assets" and the search input + catalog render unconditionally.
Convert the Sidebar to controlled tab state with an `onValueChange` handler. The Assets tab
keeps the existing search input and `CatalogPanel`; the search input moves into the Assets
branch so it no longer shows on the Scene tab. The Scene tab renders a new `ScenePanel`
component. For this slice `ScenePanel` only needs its empty state: a centered muted hint
("No objects in scene" / "Add from the Assets tab").

Verifiable by clicking between tabs: Assets shows search + catalog as before; Scene shows the
empty hint (or nothing-but-shell when objects exist — list rows arrive in slice 3).

## Acceptance criteria

- [ ] Tabs switch on click; active tab is controlled state.
- [ ] Assets tab renders the search input and `CatalogPanel`.
- [ ] Scene tab renders `ScenePanel`; no search input appears on the Scene tab.
- [ ] `ScenePanel` shows a centered hint when there are no objects.
- [ ] Existing add-from-catalog behavior is unchanged.
- [ ] Type-check and lint pass.

## Blocked by

None - can start immediately.
