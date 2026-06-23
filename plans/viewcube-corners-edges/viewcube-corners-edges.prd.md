# ViewCube — Corners, Edges & 3/4 Views

## Problem Statement

The PatioEditor ViewCube lets the user snap the camera to the top face or one
of the four cardinal side faces, but there is no way to reach an angled "3/4"
or isometric framing from the cube itself. Architects evaluating a patio
routinely want a corner-on or top-down-corner view (the classic 3/4 look) to
read depth and massing, and today they can only get there by manually
drag-orbiting and eyeballing the angle. The cube already _models_ corner
orientations internally, but they are unreachable — there is nothing on the
cube to click.

## Solution

The cube gains clickable edge and corner zones in addition to its faces,
following the familiar Autodesk-style ViewCube interaction:

- Clicking a **face** snaps head-on to that face (unchanged).
- Clicking a **corner** snaps to a true isometric 3/4 view that frames the top
  plus the two adjacent sides.
- Clicking a **vertical edge** snaps to a corner-on view that frames the two
  adjacent sides.
- Clicking a **top edge** snaps to a tilted view that frames the top plus one
  side.

Every clickable zone is discoverable: hovering it lights up exactly the region
that will be snapped to — a face fills, an edge lights as a strip, and a corner
lights as a wedge spanning the meeting faces — matching the reference image. No
extra labels clutter the cube; only the five existing face letters remain.

The whole widget stays pure DOM + CSS transforms (no three.js / GL), and all
existing behaviour — drag-to-orbit, flatten-on-face, step arrows, zoom, home —
is preserved.

## User Stories

1. As an editor user, I want to click a corner of the cube, so that I can jump to an isometric 3/4 view that shows the top and two sides at once.
2. As an editor user, I want to click a vertical edge of the cube, so that I can frame the patio corner-on between two adjacent sides.
3. As an editor user, I want to click a top edge of the cube, so that I can look down at one side at a tilt without going fully top-down.
4. As an editor user, I want each clickable zone to highlight on hover, so that I know exactly what view I will get before I click.
5. As an editor user, I want a hovered corner to light up as a wedge across the faces that meet there, so that the target reads as a 3D corner rather than a flat square.
6. As an editor user, I want a hovered edge to light up as a strip, so that I can tell an edge target apart from a face or corner.
7. As an editor user, I want the four corner views to sit at the same compass diagonals (45°/135°/225°/315°), so that the cube's geometry matches the real camera bearing.
8. As an editor user, I want corner and edge snaps to keep the patio framed in view, so that I never land staring at empty ground or sea.
9. As an editor user, I want clicking the lower part of a face to still snap to that face, so that I don't hit dead zones near the bottom of the cube.
10. As an editor user, I want face clicks to behave exactly as before (head-on snap, flatten with step arrows), so that the new zones don't regress what already works.
11. As an editor user, I want corner and edge clicks to leave the cube in its live 3D state (not flatten), so that I keep spatial context for an angled view.
12. As an editor user, I want to reach the same corner or edge whether I click it on the top face or on an adjacent side face, so that the cube feels consistent however it is rotated.
13. As an editor user, I want drag-to-orbit to keep working anywhere on the cube, so that adding zones doesn't break free rotation.
14. As an editor user, I want the cube to keep mirroring the live camera orientation, so that it still doubles as a compass and pitch indicator.
15. As an editor user, I want no extra text on the cube for the new zones, so that the widget stays clean and matches the reference image.
16. As an editor user, I want a tiny pointer travel on a zone to count as a click and a larger one as a drag, so that snapping and orbiting stay distinct on the new zones too.
17. As a developer, I want every clickable target resolved through one orientation table, so that adding or tuning a view is a single-place data change.
18. As a developer, I want the cell-to-target mapping to be a pure function, so that the hit model can be reasoned about and tested without the DOM.

## Implementation Decisions

### Target taxonomy

The cube exposes 17 click targets: `top`, 4 cardinal faces, 4 corners, 4
vertical edges, 4 top edges.

- **Corners** (`northeast`, `southeast`, `southwest`, `northwest`) are
  repurposed from their previous corner-on definition to **true top-vertex
  isometric** views: pitch **35°**, bearings 45/135/225/315.
- **Vertical edges** (`edge-ne`, `edge-se`, `edge-sw`, `edge-nw`): pitch
  **60°**, bearings 45/135/225/315 — corner-on between two sides.
- **Top edges** (`edge-top-n`, `edge-top-e`, `edge-top-s`, `edge-top-w`): pitch
  **30°**, bearings 0/90/180/270 — top tilted toward one side.
- Cardinal faces keep pitch **60°**; `top` keeps pitch 0 with "bearing
  unchanged" semantics.

Bearings deliberately collide between a corner and its vertical edge (both 45°),
and between a top edge and its face (both 0°); the two are distinguished only by
pitch and by which cell the pointer lands in. Display-unit convention is
unchanged (pitch 0 = top-down, ~85 = horizon).

### Orientation table

The face/corner → orientation lookup is extended with the eight new keys. It
remains the single source of truth: the existing snap resolver and drag-orbit
math consume it unchanged, so no snap/orbit logic is rewritten — only data is
added and the four corner pitches are retuned.

### Hit model — 3×3 grid per face

Each face becomes an invisible 3×3 grid of hot-zones (the Autodesk hit model).
The face wrapper carries the 3D transform; the nine cells inside carry the
clickable target identity. Per face:

- **Top face:** center → `top`; four corner cells → the four corner targets;
  four mid-edge cells → the four top edges.
- **Side face:** center → that face; top-mid cell → the abutting top edge;
  left/right-mid cells → the two abutting vertical edges; top-corner cells →
  the two abutting corners; **bottom row (3 cells) → the face itself** (no dead
  zones, no unsupported bottom geometry).

A given edge or corner is reachable from two or three faces; every cell for one
logical target carries the same target identity, so the click result is
identical regardless of which visible face was hit.

The cell → target assignment is implemented as a pure mapping (face identity +
cell position → target), kept separate from rendering so it can be tested in
isolation.

### Hover feedback

The cube view tracks a single `hoveredTarget` derived from the pointer's
nearest target-bearing cell. All cells sharing that target identity light up
together, producing the wedge/strip/face highlight across faces. Hover clears
when the pointer leaves the cube. This requires lifting hover from pure CSS
`:hover` to a small piece of component state, because sibling cells live in
separate face elements and cannot be co-highlighted by CSS alone.

### Interaction & state (unchanged)

- Click-vs-drag threshold, drag-to-orbit, and pointer capture are untouched; the
  existing gesture handler already reads the nearest target identity under the
  pointer, so the new cells participate automatically.
- Flatten ("selected face") mode stays **side-faces-only**. Corners, edges, and
  top resolve through the existing is-a-face gate and therefore leave the cube
  in live 3D — no flatten, no step arrows for them.
- Zoom control, home view, and the live camera mirroring are out of the change
  surface.

### Visuals

- Grid lines are invisible; cells reveal themselves only via hover highlight.
- Only the five center cells render letters (N/E/S/W/T). Edge and corner cells
  are unlabeled.
- Each face's grid is oriented in code so its cells map to the correct compass
  neighbours as the cube rotates.

### Touched surface

Type definitions, the orientation/constants table, the cube view component, and
its stylesheet. No new files are required beyond an optional co-located pure
mapping util if the cell-to-target logic is extracted for testing. No route,
service, or data-fetching changes.

## Testing Decisions

This repo has **no test runner configured**, and project convention is not to
add one unless explicitly requested. The decisions below describe _what_ would
be tested and at what seam, so tests can be dropped in if a runner is later
introduced; none are written as part of this work unless asked.

A good test here asserts **external behaviour of pure functions**, not DOM
structure or CSS. The two seams worth testing:

1. **Cell → target mapping** (the new pure util): given a face identity and a
   cell position, it returns the correct target. This is the highest-value
   target because the mapping is fiddly (per-face orientation, shared
   edges/corners, bottom-row fallback) and entirely pure.
   - Edge cases: corner cells on the top face vs. the same corner reached from
     two side faces resolve to the _same_ target; bottom-row cells fall back to
     the face; mid-edge cells on a side face resolve to the correct vertical vs.
     top edge per compass orientation.
2. **Orientation resolution** through the existing snap resolver, now exercised
   with the eight new keys: each target resolves to the documented
   bearing/pitch, the colliding bearings (corner vs. vertical edge; top edge vs.
   face) differ only by pitch, and `top` still passes the live bearing through.

Prior art: the existing pure helpers in the cube's camera-math util are already
documented as "pure + testable" (bearing normalization, step-face, snapped-face
tolerance), so these new assertions follow the same single-input → single-output
shape and would live beside them.

No tests are planned for the gesture handler, the React component, or CSS — they
are shallow integration glue and would test implementation details.

## Out of Scope

- Edge/corner targets on the cube's **underside** (bottom face, bottom edges,
  bottom corners): the camera never sees them, so they are intentionally
  unsupported; their cells fall back to the face.
- Flatten ("selected face") mode for corners/edges, and any step-arrow
  navigation between corners or edges.
- Animated bevel/chamfer geometry: the cube stays flat-faced; corners and edges
  are hit-zones + highlights, not modelled 3D chamfers.
- Changes to zoom, home-view persistence, drag sensitivity, or the live camera
  adapter.
- Keyboard navigation of the cube, touch-specific gestures beyond the existing
  pointer model, and accessibility labelling of individual zones.
- Adding a test runner or test tooling to the repo.

## Further Notes

- The corner pitch retune (60° → 35°) is the only **behaviour change to an
  existing target**; everything else is additive. Worth a quick visual check
  that the new iso framing still keeps the patio bounds filled, since the
  framing clamp lives in the camera adapter.
- Because corner and vertical-edge bearings coincide, the two are only
  distinguishable by where the pointer lands on the cube; the 3×3 grid is what
  makes them separately clickable. If a future design wants them visually
  distinct at rest (not just on hover), that's a follow-up.
- Pitch values (35/60/30) were chosen as sensible defaults and may be tuned
  live in the editor without touching any logic — they are pure data in the
  orientation table.
