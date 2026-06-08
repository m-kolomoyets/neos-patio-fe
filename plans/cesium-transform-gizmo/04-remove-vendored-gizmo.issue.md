## What to build

Remove the now-unused vendored gizmo. With translate, rotate, and scale all driven by the custom gizmo (slices #1–#3), delete the `vendor/cesium-gizmo/` directory (its JS, GLSL, and the hand-written `.d.ts`) and any remaining imports/types referencing it. Confirm nothing in the editor still imports the vendored module or its `GizmoMode` type, leaving the custom gizmo as the sole transform implementation.

## Acceptance criteria

- [ ] `vendor/cesium-gizmo/` directory and its `.d.ts` are deleted
- [ ] No source file imports the vendored gizmo or its types (grep clean)
- [ ] All three transform modes still work via the custom gizmo
- [ ] `npm run tsc` and `npm run lint` pass with no dangling references or unused-import errors

## Blocked by

- Blocked by #01-gizmo-core-translate
- Blocked by #02-rotate-mode
- Blocked by #03-scale-mode
