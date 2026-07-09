# Patio View Page — PRD

## Problem Statement

Today, opening any patio (`/patios/$id`) drops the user straight into the **Patio Editor** — a heavy, editable 3D scene with sidebar, toolbar, and object manipulation. There is no read-only way to simply *look at* a patio: a clean, presentational view of the place in 3D with basic camera controls. Users who only want to view a patio are forced into an editing surface they don't need, and every "open patio" link commits them to the editor.

## Solution

Split the patio experience into two routes:

- **Patio View** (`/patios/$id/`) — a new read-only page. Create-patio-style framed surface, a minimal header (back button + centered patio name), the same Cesium 3D terrain map as the editor but view-only (orbit, zoom, limited pan, idle rotation around the patio center), and the ViewCube navigation widget. A loading overlay covers map initialization for a smooth first paint.
- **Patio Editor** (`/patios/$id/edit`) — the existing editor, unchanged in behavior, moved to an explicit `/edit` sub-route.

All existing "open patio" entry points (home markers, action bar) now land on the **View** page by default. The editor is reached explicitly via `/edit`.

## User Stories

1. As a user browsing patios, I want clicking a patio to open a clean read-only view, so that I can look at the place without entering an editing tool.
2. As a user on the view page, I want to see the patio rendered on the same photorealistic 3D terrain map as the editor, so that the experience is consistent.
3. As a user on the view page, I want the camera to orbit around the patio center, so that I can see the place from different angles.
4. As a user on the view page, I want to zoom in and out, so that I can inspect detail or see the surroundings.
5. As a user on the view page, I want limited panning around the center, so that I can reposition slightly without losing the patio.
6. As a user on the view page, I want the camera to *not* be able to fly away freely, so that the patio always stays framed.
7. As a user on the view page, I want the map to idly rotate when I'm not interacting, so that the view feels alive.
8. As a user on the view page, I want a ViewCube widget, so that I can reorient the camera and jump to preset views just like in the editor.
9. As a user on the view page, I want a header showing the patio's name centered, so that I know what I'm looking at.
10. As a user on the view page, I want a back button, so that I can return to home.
11. As a user on the view page, I want the header to omit the location search and mode/create controls, so that the read-only surface stays uncluttered.
12. As a user deep-linking or refreshing directly on a patio view URL, I want a loading overlay while the map initializes, so that I don't see a blank flash.
13. As a user, I want the loading overlay to show the patio's preview background and name, so that the wait feels contextual.
14. As a user who wants to edit, I want the editor available at an explicit `/edit` URL, so that viewing and editing are cleanly separated.
15. As a returning editor user, I want the editor to behave exactly as before once open, so that nothing about my editing workflow changes.
16. As a user leaving the map mid-load (browser back), I want the loading overlay to clear immediately, so that it doesn't linger on the next page.
17. As a developer, I want the ViewCube, Cesium map, and their camera/orbit dependencies to be shared components, so that editor and view stay in sync from one source of truth.
18. As a developer, I want the editor's route-api and imports updated to the new `/edit` path, so that the app compiles and routes correctly after the split.

## Implementation Decisions

**Routing**
- Editor moves from `/patios/$id` to `/patios/$id/edit`. View is the index route `/patios/$id/`.
- View route loader prefetches only the patio detail query (no models — view has no editing).
- Editor route loader keeps prefetching both models and patio.
- Existing navigation helpers already target `to: '/patios/$id'`, which now resolves to the View index — no navigation call-site changes required.
- Editor's route-api wrapper is re-pointed from `/patios/$id` to `/patios/$id/edit`.

**Shared Cesium modules (promoted out of the editor module)**
- **CesiumMap** — the map host (imperative Cesium viewer creation, Google Photorealistic 3D Tiles, bounds framing, teardown). Gains an `interaction: 'edit' | 'view'` prop. In `'view'`, the camera controller is constrained to orbit + zoom + limited pan; free translate/fly is disabled. `'edit'` preserves today's behavior. One source of truth for the map.
- **ViewCube** — promoted to a shared component. Its three editor-internal couplings are broken: `bounds` and a `storageId` (patio id, used for the home-view localStorage key) become **props**; the Cesium viewer and orbit target come from the now-shared viewer context and orbit hook.
- **CesiumViewerContext** — promoted to a shared context; provides the viewer to overlay widgets (ViewCube) for both routes.
- **useOrbitTarget** and **useIdleRotation** — promoted to shared hooks; used by both editor and view shells.
- The `sampleSurfaceHeight` helper is extracted to a shared util so shared code doesn't import from the editor module; the rest of the editor's geo-placement logic stays in the editor.
- Idle rotation runs in **both** editor and view.

**View module**
- A new `PatioView` module mirrors the create-patio composition (framed "surface" card, app background), not the editor's editing shell.
- Header is a three-zone layout: left = back button (navigates to home), center = patio name as an `h1`, right = empty. No location search, no mode/create button.
- Subtitle line is **omitted**: the patio data model has no description/tagline field, and the decision is to render no invented data.
- The module reads the patio via a suspense query and feeds the loading overlay the patio's preview background and name.

**Loading overlay**
- Reuse the existing shared page-transition overlay. The shared CesiumMap already signals "ready" once the first tiles settle, clearing the overlay on both routes.
- The overlay's self-activation path matcher is widened so it matches both `/patios/$id/` (view) and `/patios/$id/edit` (editor).

## Testing Decisions

This repository has **no test runner configured** (per project conventions, tests are not added unless explicitly requested). Therefore verification is **manual / end-to-end via the running app**, not automated unit tests. A good check here exercises externally observable behavior, not internal wiring.

Manual verification checklist:
- Deep-link `/patios/<id>/` → View renders: overlay shows then clears, header shows back button + centered patio name (no search / mode button), map framed on the patio, ViewCube bottom-right.
- View camera: orbit + zoom + limited pan work; free-fly away from center is impossible; idle rotation resumes when idle.
- Deep-link `/patios/<id>/edit` → Editor unchanged (objects, sidebar, toolbar, viewcube); overlay still fires.
- From home, clicking a patio marker / action-bar result lands on View (`/patios/<id>/`).
- Back button on View returns to home.
- Browser-back mid-load clears the overlay immediately.
- `npm run tsc` and `npm run lint` pass.

If automated tests are desired later, the highest-value isolable units are the shared **CesiumMap** camera-constraint logic (view vs edit) and the **ViewCube** camera math utilities (already self-contained pure functions) — but adding a test runner is out of scope here.

## Out of Scope

- The Figma view screen's **right details panel** (Owner / Size / Azimuth / Price / Status + "Create Patio" button).
- The Figma **left toolbar** (compass / photo / orientation stack).
- The Figma **bottom-center bar** (search / segment / record controls).
- Any patio **description/subtitle** field or the data model changes to support it.
- Adding a test runner or automated test suite.
- Any change to editor editing behavior beyond its route move and shared-module import updates.
- An explicit "Edit" affordance/button on the View page (view→edit navigation UI) — reachable by URL for now.

## Further Notes

- Figma reference: node `9399-12426` (title "Sagrada Família", back button top-left, ViewCube bottom-right of the map).
- The route-tree file is auto-generated and must not be hand-edited; it regenerates on dev/build.
- Because existing nav already points at `/patios/$id`, the split is low-risk on the navigation surface; the main mechanical work is the module promotions and their import updates.
</content>
