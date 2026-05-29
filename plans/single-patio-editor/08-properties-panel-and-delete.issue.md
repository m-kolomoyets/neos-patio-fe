## What to build

Add `PropertiesPanel` (floating right) shown when an object is selected. Numeric inputs (Base UI primitives from `src/components/ui`) for `lng`, `lat`, `alt`, `yawDeg` (UI in degrees; reducer converts to/from radians), and `scale`. Each edit dispatches `transform`. Add a delete button that dispatches `remove`. Implement the `remove` action in the reducer.

## Acceptance criteria

- [ ] Reducer handles `remove`
- [ ] `src/modules/PatioEditor/components/PropertiesPanel/` renders when `selectedId !== null`
- [ ] Inputs for `lng`, `lat`, `alt`, `yawDeg`, `scale` — all reflect current selection
- [ ] Edits dispatch `transform`; mesh updates immediately
- [ ] Yaw shown in degrees; reducer stores radians
- [ ] Delete button removes the selected object and clears `selectedId`
- [ ] Numeric edits also pass through `BoundsClamp`
- [ ] `npm run tsc` and `npm run lint` clean

## Blocked by

- Blocked by `06-selection-and-gizmo.issue.md`
