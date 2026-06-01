# Patio Editor — ViewCube Navigation Gizmo & Map Zoom Control

## Problem Statement

In the 3D patio editor the only camera controls are maplibre's default `NavigationControl` (zoom +/−, a compass dial) plus map drag/scroll. For a 3D scene-editing experience this is weak:

- There is no fast way to snap to a known orientation (top-down, a cardinal side view, a 3/4 corner view). A designer must hand-drag bearing and pitch to approximate them.
- The compass dial only conveys bearing — it gives no sense of pitch or of which "side" of the scene you're looking at.
- There is no "home" view: no way to save a preferred framing of a patio and return to it.
- Zoom is expressed only as +/− steps; there is no readout, no "zoom to fit the patio", and no preset zoom levels.
- The default control's look does not match the product's design language.

## Solution

Replace the default navigation control with a custom bottom-right widget, matching the Figma design, that bundles three things:

- A **ViewCube gizmo** (AutoCAD-style) — a small 3D cube whose perspective tracks the live map bearing and pitch. Clicking a face or corner snaps the camera to that orientation; dragging the cube orbits the map (bearing + pitch) directly. When a face is clicked the cube enters a flattened "looking at this face" state with helper arrows to step to adjacent faces or to the top.
- A **Home button** — jumps to a saved home view; the zoom popover can set the current view as home or reset it to the editor default.
- A **Zoom control** — a `− [%] +` stepper showing a percentage, plus a popover menu (Zoom in / out / to fit / 50% / 100% / 200% / Set current view as Home / Reset Home).

The result is a single, on-brand camera control that gives designers fast, predictable framing of the patio without abandoning maplibre's geographic camera.

## User Stories

1. As a patio designer, I want a small cube that shows my current viewing angle, so that I always know which way and how steeply I'm looking at the scene.
2. As a patio designer, I want the cube's perspective to update live as I pan/rotate/tilt the map, so that it stays an accurate compass-and-pitch indicator.
3. As a patio designer, I want to click the top face of the cube, so that I snap to a top-down plan view.
4. As a patio designer, I want to click a side face (N/E/S/W), so that I snap to a near-elevation view of that side.
5. As a patio designer, I want to click a corner of the cube, so that I snap to a 3/4 isometric-style view from that corner.
6. As a patio designer, I want to drag the cube horizontally, so that I rotate the map's bearing directly.
7. As a patio designer, I want to drag the cube vertically, so that I tilt the map's pitch directly.
8. As a patio designer, I want a hover highlight on the cube's faces and corners, so that I can tell what I'm about to click.
9. As a patio designer, I want clicking a face to flatten the cube to that face with helper arrows, so that I get an oriented, head-on framing and controls to move between adjacent views.
10. As a patio designer, I want left/right arrows in the flattened state to step the view to the neighboring side, so that I can walk around the scene one quarter-turn at a time.
11. As a patio designer, I want an up arrow in the flattened state to jump to the top view, so that I can switch to plan view quickly.
12. As a patio designer, I want orbiting the map (by drag) to exit the flattened state back to the live cube, so that the widget reflects that I've moved off the snapped angle.
13. As a patio designer, I want a Home button, so that I can return to a known framing of the patio in one click.
14. As a patio designer, I want to set the current view as my Home, so that my preferred framing is one click away.
15. As a patio designer, I want to reset Home to the editor default, so that I can undo a home I no longer want.
16. As a patio designer, I want my Home view to persist across reloads for that patio, so that I don't have to re-frame every session.
17. As a patio designer, I want a zoom readout as a percentage, so that I have a sense of scale relative to a reference zoom.
18. As a patio designer, I want +/− zoom buttons, so that I can step zoom in and out.
19. As a patio designer, I want a zoom popover with presets (50% / 100% / 200%), so that I can jump to a known zoom.
20. As a patio designer, I want a "zoom to fit" option, so that the whole patio footprint frames itself in view.
21. As a patio designer, I want the camera transitions to animate smoothly, so that I don't lose spatial context when snapping.
22. As a patio designer, I want the cube to remain usable while an object is selected/being transformed, so that I can re-frame without deselecting.
23. As a patio designer, I want the custom widget to replace the default maplibre control, so that the UI is consistent and uncluttered.

## Implementation Decisions

### Scope
- One overlay widget combining the ViewCube, Home button, and map-zoom stepper + popover. "Scaling" in the original request means **map zoom**, not object scale. The existing object-scale control in the Properties panel is untouched.

### Camera model (the load-bearing constraint)
- Maplibre is a **geographic camera**, not a free 3D orbit camera: bearing 0–360°, pitch clamped 0–`maxPitch`, always looking at the ground from above. True head-on elevations (90° pitch) and free roll are impossible.
- `maxPitch` is raised to **85°** in the map config to make side views as elevation-like as possible (terrain is enabled, which permits 85°).
- Cube click targets are **9 total**: top face + 4 side faces + 4 corners. The 12 edges are intentionally dropped (low value, high hit-test complexity).
- Target → camera mapping (all via `easeTo`):
  - **Top** → pitch 0 (true top-down), bearing unchanged.
  - **Side (N/E/S/W)** → bearing snapped to 0/90/180/270, pitch 85 (pseudo-elevation).
  - **Corner (NE/SE/SW/NW)** → bearing 45/135/225/315, pitch 60 (3/4 view).
- Side faces are **not** true orthographic elevations; this is an accepted limitation of the maplibre camera.

### Cube rendering
- The cube is a **pure DOM widget using CSS 3D transforms** (a container with 6 face `<div>`s), not a three.js scene. The existing react-three-map `Canvas` is map-locked/projection-overridden and unsuitable for a screen-fixed overlay.
- Cube transform mirrors the camera: `rotateX(pitch) rotateZ(-bearing)` (signs tuned so N sits correctly at bearing 0).
- Faces carry `data-face` attributes for click + hover. Side faces are labeled **N / E / S / W**; the top face is labeled **T**; the bottom is never seen. Letters are painted on the faces (rotate with the face), matching Figma.
- Hover highlight is CSS `:hover` per face/corner.

### Camera state & sync
- Camera (bearing/pitch/zoom) is **not** put into the `EditorContext` reducer — it must not enter undo/redo history.
- The widget reads camera state from the maplibre `Map` instance and holds `{ bearing, pitch, zoom }` in **local component state**, updated by subscribing to the map's `move`/`rotate`/`pitch` events. It writes back via `map.easeTo` / `setBearing` / `setPitch` / `setZoom`.
- Because the widget is a screen-fixed overlay (likely a sibling of `<Map>`), the maplibre `Map` ref is lifted in `MapCanvas` and passed down, or the widget is rendered as a DOM child of `<Map>` so `useMap()` reaches it.

### Drag-to-orbit
- Horizontal drag Δx → `bearing += Δx · k`; vertical drag Δy → `pitch += Δy · k` (clamped 0–85). Live update on each move (instant, no animation).
- **Free release** — the camera stays where the drag leaves it; snapping happens only on click. (AutoCAD behavior.)
- Maplibre's own interaction handlers are disabled while the cube is being dragged (same pattern the object `TransformControls` uses).

### Flattened "selected face" state
- **Enter**: clicking a **face** snaps to that side view and flattens the cube to that face with helper arrows. Clicking a **corner** snaps to a 3/4 view but stays a 3D cube (no single face is head-on).
- **Exit**: any drag-orbit, or the camera moving away from the snapped bearing/pitch beyond a threshold, returns to the live 3D cube. No explicit close affordance.
- **Arrows**: left/right step bearing ±90° to the adjacent side (re-snap + stay flattened); up arrow → top view. The **roll/corner arrows from the Figma design are omitted** because maplibre has no camera roll.
- The flattened face is a **stylized UI abstraction** — it is drawn flat regardless of the real ~85° camera pitch; it is not a pixel-accurate mirror of the camera in that mode.

### Zoom control
- 100% is anchored to the editor's reference zoom (`DEFAULT_ZOOM`, currently 15). Percentage = `2^(zoom − refZoom) · 100`. A whole zoom level equals a 2× scale, so the 50% / 100% / 200% presets fall on adjacent integer zoom levels and match the Figma doubling.
- `+` / `−` step zoom by ±1 level.
- "Zoom to fit" calls `fitBounds(patioBounds)` using the bounds already in editor state.
- Popover presets "Zoom to 50/100/200%" set `zoom = refZoom + log2(pct/100)`.

### Home view
- A home view is a camera snapshot `{ center, zoom, bearing, pitch }`.
- **Default home** = the editor's `initialViewState` (center, zoom 15, pitch 45, bearing 0).
- Home is **persisted in `localStorage`, keyed by patio id**. No backend/service persistence.
- Home button → `easeTo(home)`. "Set current view as Home" → write current camera to localStorage. "Reset Home" → clear localStorage + ease to the default.

### Transitions
- All programmatic camera moves (face/corner snap, arrows, home, zoom presets) use `easeTo({ duration: 400 })` with default maplibre easing. Drag orbiting is instant.

### Removed / replaced
- The default maplibre `NavigationControl` is removed; the custom widget replaces its zoom + compass role.
- The widget is placed **bottom-right** (clear of the top-right Properties panel and top-center Toolbar).

### Component structure & UI primitives
- New module folder `ViewCube/` under the editor's components, following the established `index.tsx` + `styles.module.css` anatomy, with a `ZoomControl/` sub-component. Cube math/helpers go in a local `utils/`; the face/corner → camera target table goes in `constants.ts`.
- The zoom popover uses the project's Base UI popover/menu primitive for positioning and keyboard handling, reusing the existing `PopupWrapper` (styled panel container) and `OptionItem` (menu row) UI components. Hand-rolled only if adding the primitive proves disproportionate.

### Interaction conflicts
- The cube widget is independent screen-fixed DOM and never touches the 3D raycaster, so it does not conflict with the object `TransformControls`. Orbiting the camera while an object is selected is fine (the object stays put in world space). No special mitigation; the widget's z-index sits above the canvas and below any modal/dialog.

## Testing Decisions

This repository has **no test runner configured** (per `CLAUDE.md`), and the convention is not to add one unless explicitly requested. No automated tests are introduced as part of this work.

The logic that *would* be unit-testable if a runner is later added is the pure camera-math, isolated into the local `utils/`/`constants.ts`. A good test asserts only external behavior (inputs → outputs), not DOM wiring:

- **Face/corner → camera target** — given a click target, returns the expected `{ bearing, pitch }` (e.g. top → pitch 0; "E" → bearing 90, pitch 85; "NE" → bearing 45, pitch 60).
- **Bearing → cube transform** — given bearing/pitch, returns the expected `rotateX`/`rotateZ` values, including wrap-around at 0/360.
- **Zoom ↔ percentage** — `zoom → %` and `% → zoom` round-trip about the reference zoom (15 → 100%, 16 → 200%, 14 → 50%).
- **Adjacent-face stepping** — left/right from a given side yields the correct neighboring side bearing.

Verification is otherwise manual in the running editor: confirm the cube tracks live bearing/pitch; click each of the 9 targets and confirm the snap; drag to orbit and confirm free release; enter/exit the flattened state; step arrows; set/reset/return Home and confirm it survives reload; exercise every zoom popover item including fit; confirm the cube still works with an object selected.

## Out of Scope

- True orthographic elevation views (head-on, 90° pitch) — impossible with the maplibre camera.
- Camera roll / banking, and therefore the Figma roll (corner) arrows in the flattened state.
- The 12 cube **edge** click targets (only faces + corners are supported).
- Cube edges/edge-snap and arbitrary free-angle presets beyond the 9 defined targets.
- Server/cross-device persistence of the Home view (localStorage only).
- Object scale / Properties-panel changes (this is map zoom, not object scaling).
- Changing map terrain, buildings, `maxBounds`, or the underlying projection (beyond raising `maxPitch` to 85).
- Putting camera state into undo/redo history.

## Further Notes

- The central tension throughout is that an AutoCAD ViewCube assumes a free orbit camera while maplibre is a geographic one. Every "can't do this exactly" decision (pseudo-elevation side views, no roll arrows, no true top-elevation, flattened face as abstraction) flows from that single constraint and is accepted deliberately rather than worked around.
- Keeping camera state in local widget state (not the reducer) is intentional: camera framing is ephemeral viewport state, not document state, and must not pollute undo/redo.
- CSS 3D transforms were chosen over a second three.js canvas because the cube is a screen-fixed ~100px widget with flat shading and text labels — DOM gives free click targets, hover, and labels with no GL overhead, and matches the Figma flat-shaded look.
