# Cesium-Native Custom Transform Gizmo

## Problem Statement

After migrating the patio editor from MapLibre + react-three-fiber to a native Cesium viewer, placed objects are real Cesium `Model` primitives positioned by a geographic + HPR pose baked into their `modelMatrix`. The editor currently drives transforms through a **vendored third-party gizmo** (`vendor/cesium-gizmo`, ~700 LOC of raw `DrawCommand` WebGL + GLSL). That gizmo is glitchy and buggy: its thin GPU-picked geometry mis-hits, it is hard to size consistently, and it is effectively untyped (a hand-written `.d.ts` shim that must be kept in sync with opaque JS). It is not maintainable and produces a poor editing experience.

## Solution

Replace the vendored gizmo with a **custom, typesafe, Cesium-native transform gizmo** built from real 3D mesh primitives. The user selects a placed object and, in the active transform mode (translate / rotate / scale), sees clean, good-looking handles drawn on top of the model that stay a constant on-screen size at any zoom. Dragging a handle transforms the object live and smoothly; releasing commits exactly one undoable change. The gizmo reliably hits what the user clicks, looks like a standard editor gizmo (colored axis arrows, rotation rings, scale cubes), and is fully type-checked TypeScript with no vendored black box.

## User Stories

1. As a patio editor, I want a reliable gizmo that grabs the handle I actually click, so that transforming objects doesn't feel glitchy.
2. As a patio editor, I want the gizmo to stay the same on-screen size whether I'm zoomed in or out, so that handles are always easy to grab.
3. As a patio editor, I want the gizmo drawn on top of the model so handles are never hidden inside the mesh, so that I can always grab them.
4. As a patio editor, I want colored X/Y/Z arrows in translate mode, so that I can drag an object east/west, north/south, or up/down.
5. As a patio editor, I want horizontal moves to re-ground the object to the real surface, so that furniture stays sitting on the patio.
6. As a patio editor, I want a vertical (up) drag to keep the exact height I set, so that I can lift or sink an object without it snapping back to the ground.
7. As a patio editor, I want my object to stay within the patio bounds when I move it, so that I can't place it outside the editable area.
8. As a patio editor, I want three rotation rings (heading/pitch/roll) in rotate mode, so that I can orient an object in any direction.
9. As a patio editor, I want rotation to feel natural around the visible ring I grab, so that orienting an object is predictable.
10. As a patio editor, I want three colored scale cubes in scale mode that scale the whole model uniformly, so that the model never gets distorted along one axis.
11. As a patio editor, I want the model to update live and smoothly while I drag, so that I get immediate feedback on the transform.
12. As a patio editor, I want map panning/zooming to pause while I drag a handle, so that my drag doesn't fight the camera, and resume when I release.
13. As a patio editor, I want each drag to produce exactly one undo entry, so that one undo reverts one transform.
14. As a patio editor, I want clicking a gizmo handle to NOT change my selection, so that the gizmo doesn't tear itself down mid-interaction.
15. As a patio editor, I want clicking empty ground to deselect and clicking another object to select it, so that selection keeps working alongside the gizmo.
16. As a patio editor, I want the selection outline to keep tracking the object as I transform it, so that I always see what's selected.
17. As a patio editor, I want the gizmo to appear only after the model has finished loading, so that it always attaches to a real, visible object.
18. As a patio editor, I want the gizmo to switch handles when I change mode (translate/rotate/scale), so that I only see the affordances for the current tool.
19. As a patio editor, I want the gizmo to disappear when I deselect, so that the scene is clean when nothing is selected.
20. As a developer, I want the gizmo to be fully typed TypeScript with no vendored JS/GLSL black box, so that it is maintainable and refactor-safe.

## Implementation Decisions

### Render approach
- Build the gizmo from **real 3D mesh Cesium primitives** rendered in-scene (not 2D billboards, not raw `DrawCommand`s).
- Geometry: axis shafts as cylinders, arrowheads as cones (a cylinder with a zero top radius), scale handles as boxes/cubes, rotation rings as tori.
- Each piece is a geometry instance with a flat per-instance color appearance: red/green/blue per axis, gray for scale cubes, consistent with a standard editor look.
- Each instance carries a typed pick id describing which axis and which handle kind it is, so a pick result identifies the grabbed handle unambiguously.
- The gizmo is drawn **always on top** (depth test disabled) so handles stay visible and grabbable even when geometrically behind the model.

### Frame & sizing
- Axes are oriented in the **world ENU frame** (east / north / up) at the object's origin, independent of the object's current heading/pitch/roll (a "global" gizmo). This matches the existing geographic reground/clamp logic, which works in lng/lat/height.
- The gizmo's root transform is **rescaled every frame on the scene pre-render hook** by camera distance so the gizmo keeps a constant on-screen pixel size at any zoom.

### Hit-testing
- Use Cesium `scene.pick` against the solid mesh handles. Solid volumes (cones/cubes/tori) are reliably pickable, unlike the vendored thin geometry — this is the core reliability fix.
- The existing selection handler must ignore the gizmo's new handle pick ids (today it special-cases the vendored gizmo's pick id shape) so clicking a handle never changes selection.

### Modes (mode-switch retained)
- Keep the existing editor `EditorMode` (translate / rotate / scale). Only the **active mode's** handles are shown; switching mode rebuilds the gizmo's handles.
- **Translate** — X/Y/Z arrows. Drag math resolves the new position as the closest point between the mouse ray and the world axis line (robust across zoom and view angle). The dragged axis is tracked into the commit: a horizontal (east/north) drag re-grounds the object to the sampled surface height and clamps to bounds; a vertical (up) drag keeps the manually set height.
- **Rotate** — three rings (heading/pitch/roll). A drag applies a rotation delta about the chosen world ENU axis directly to the model matrix; on commit the matrix is decomposed back into heading/pitch/roll via the existing matrix→geo-pose conversion.
- **Scale** — three colored axis cubes that behave uniformly. Dragging any cube changes the single uniform `scale` field by the ratio of current to start distance from the origin. No per-axis scale; the data model is unchanged.

### Drag lifecycle / plumbing
- During a drag, mutate the live model's `modelMatrix` directly (the current contract), requesting a render each step for smooth feedback under `requestRenderMode`.
- On drag-start: disable the Cesium screen-space camera controller inputs and suppress the selection click so the drag neither orbits the camera nor reselects.
- On drag-end: decompose the model matrix into a geographic + HPR patch and dispatch a single `transform` action (one history entry), then re-enable camera inputs.
- The gizmo is (re)created when the selection, mode, or model-ready version changes, and torn down when nothing is selected.

### Module structure (deep modules in isolation)
- A new framework-agnostic gizmo unit owns geometry construction, picking, the drag state machine, and the per-frame screen-constant rescaling, exposing a small lifecycle interface (attach to a model in a given mode, callbacks for drag-moving / drag-end, destroy) — mirroring how the editor consumed the vendored gizmo, so the React surface barely changes.
- Drag math (ray-to-axis closest point, rotation delta about an axis, scale ratio) is factored into pure functions so it is independently reasoned about.
- The thin React hook only manages lifecycle (instantiate/destroy on selection + mode + ready changes) and wires drag-end to the editor dispatch.
- The vendored `cesium-gizmo` directory and its hand-written declaration import are deleted.

### Unchanged
- The `PlacedObject` schema, the geographic↔model-matrix conversions, the editor reducer, the undo/redo history, and persistence are all unchanged. Scale stays a single uniform number; orientation stays an HPR triple.

## Testing Decisions

This repository has **no test runner configured**, and CLAUDE.md explicitly instructs not to add one unless asked. No automated tests are written for this change. Verification is **manual / build-time**:

- Type-check passes (`npm run tsc`) — the whole gizmo is typed, replacing the vendored `.d.ts` shim.
- Lint passes (`npm run lint` — eslint, stylelint, prettier).
- Manual end-to-end check in the dev server (`npm run dev`):
  - Selecting a loaded object shows the active mode's handles; deselecting removes them; switching mode swaps handle sets.
  - Handles stay constant on-screen size while zooming in/out and remain grabbable when behind the model (always-on-top).
  - `scene.pick` reliably grabs the clicked handle; clicking a handle does not change selection; clicking empty ground deselects and clicking another object selects it.
  - Translate: each axis drags correctly; horizontal drag re-grounds to surface and clamps to bounds; vertical drag keeps the set height.
  - Rotate: each of the three rings changes orientation; values round-trip into heading/pitch/roll on commit.
  - Scale: dragging any cube scales the whole model uniformly with no distortion.
  - Model updates live and smoothly during a drag; map pan/zoom is suppressed during the drag and restored after.
  - Each drag produces exactly one undo entry; undo/redo works after gizmo edits; the selection outline tracks the object throughout.

If automated coverage is later wanted, the natural deep, isolated units are the **pure drag-math functions** (ray-to-axis closest point, rotation delta, scale ratio) and the existing **geo↔model-matrix conversions**, since they have simple, stable interfaces and carry the riskiest math — but writing them is out of scope here per repo convention.

## Out of Scope

- Non-uniform (per-axis) scaling — scale stays a single uniform value; the three cubes are cosmetic-per-axis but act uniform.
- A unified/simultaneous gizmo (all three transforms visible at once) — the editor keeps mode-switching; the reference image is a look reference only.
- Model-local (object-relative) gizmo axes — axes are world ENU.
- Planar (two-axis) translate handles, snapping/grid increments, and keyboard shortcuts for transforms.
- Multi-object selection or group transforms.
- Changes to `PlacedObject` schema, geo↔matrix conversions, the reducer, undo/redo, selection picking architecture, or persistence beyond removing the vendored gizmo and ignoring the new handle pick ids in selection.
- Adding a test runner or automated tests.

## Further Notes

- This supersedes the stale `combined-transform-gizmo.prd.md`, which described a pre-Cesium r3f/`TransformControls` design (simultaneous handles, model-local, per-axis). That design does not apply to the native Cesium scene.
- The reference image (colored arrows + gray scale cubes + dashed rotation arcs shown together) informs the visual style only; behavior remains mode-switched.
- Always-on-top depth was chosen over occlusion so handles are never lost inside the mesh; if a more "physical" look is wanted later, depth-testing could be revisited as a follow-up.
- Keeping the gizmo in the world ENU frame keeps the rotate/translate math consistent with the existing reground-and-clamp logic; a future "local frame" toggle could be added without changing the data model.
