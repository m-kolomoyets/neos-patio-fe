# Patio Loading Transition

## Problem Statement

When a user opens a patio (navigates to `/patios/$id`), the destination screen is heavy: the route fetches patio data, then mounts a Cesium viewer that streams Google Photorealistic 3D Tiles. During this window the user sees a jarring blank/partial screen — no feedback that the place is loading, and the 3D map "pops" in unfinished. There is no graceful bridge between the page they left and the patio being ready to view.

## Solution

A full-screen loading transition that appears the moment the user starts navigating to a patio and stays until the patio's 3D place is actually rendered.

- The overlay shows the patio's `previewBackgroundUrl` as a full-bleed background, a dark scrim, a centered brand spinner (ring with the Neos logo in the middle), and a `Loading {patio name}` label — matching the Figma design (node `6658-83482`).
- It fades in immediately on navigation and fades out only once the Cesium map has framed the place by its coordinates and its tiles/LOD have finished their first load — so the user never sees the map building itself.
- It works both when entering from the Home page (background + name known instantly) and on a direct deep-link / refresh (starts on a dark background with `Loading…`, then swaps in the real background and name once the patio query resolves).

## User Stories

1. As a user, when I click a featured patio card on Home, I want a loading screen to appear immediately, so that I get instant feedback that my navigation registered.
2. As a user, when I click a patio in the library list, I want the same loading screen, so that the experience is consistent regardless of where I clicked.
3. As a user, I want the loading screen to show the patio's preview image as its background, so that I already feel connected to the place I'm about to explore.
4. As a user, I want a branded spinner with the Neos logo in its center, so that the wait feels intentional and on-brand.
5. As a user, I want to see the name of the patio I'm loading ("Loading Louvre Abu Dhabi"), so that I'm reassured I'm heading to the right place.
6. As a user, I want the loading screen to fade in smoothly rather than snap on, so that the transition feels polished.
7. As a user, I want the loading screen to stay up until the 3D map has actually rendered the location, so that I never watch the map awkwardly assemble itself.
8. As a user, I want the loading screen to fade out smoothly once the map is ready, so that the reveal of the patio feels deliberate.
9. As a user opening a patio link directly (deep-link or refresh), I want the loading screen to appear right away on a dark background, so that I'm not staring at a blank page while data loads.
10. As a user on a deep-link, I want the background image and patio name to appear as soon as they're known, so that the screen completes itself gracefully.
11. As a user, I don't want the loading screen to flicker on fast loads, so that the experience feels smooth even when things resolve quickly.
12. As a user, if the map takes unusually long to settle, I want the loading screen to eventually clear anyway, so that I'm never stuck on a permanent loading screen.
13. As a user, if the patio fails to load, I want the loading screen to clear so I can see the error state, so that I'm not left waiting indefinitely.
14. As a user, if I navigate away before the patio finishes loading, I want the loading screen to reset cleanly, so that it doesn't linger on the next page.
15. As a developer, I want a single source of truth controlling the transition, so that any navigation entry point can trigger it consistently.
16. As a developer, I want a reusable brand spinner component, so that the logo-in-spinner can be used elsewhere if needed.
17. As a developer, I want a navigation helper that starts the transition and navigates in one call, so that trigger logic isn't duplicated across cards.

## Implementation Decisions

### Architecture

- **Global control via context.** A `PageTransition` context provider lives at the root route (`__root`), above `<Outlet/>`. It is the single source of truth for the overlay so the transition survives the route swap — it must persist across two phases: (a) route data loading and (b) the mounted patio editor while map tiles still stream. A router `pendingComponent` alone is rejected: it dies once the route renders, which is too early to wait for Cesium.

- **Context API:**
  - State: `active: boolean`, `backgroundUrl?: string`, `name?: string`.
  - `start(payload?: { backgroundUrl?, name? })` — activate the overlay; payload optional so deep-links can start with no image/name.
  - `update(payload: { backgroundUrl?, name? })` — swap in background/name later (used after the patio query resolves on the deep-link path).
  - `finish()` — begin fade-out and reset. Called on the Cesium ready signal, on query error, or on the safety timeout.

- **Overlay component** rendered in `__root`, driven by context state. Layers: full-bleed background (`previewBackgroundUrl`, `cover`), dark scrim, centered brand spinner, `Loading {name}` text below it. Uses the existing `motion` library (already a dependency) for fade.

- **Brand spinner** is a new UI primitive `LoadingSpinnerWithLogo` (own folder, `index.tsx` + `styles.module.css`), built by reusing the existing `LoadingSpinner`'s conic-gradient ring with the logo SVG (`src/icons/logo-sm_35.svg`, imported `?react`) absolutely centered. Ring spins, logo is static. The logo uses `currentColor` so it tints to white.

### Entry points / triggers

- **From Home (both cards):** a helper hook (`usePatioTransitionNavigate` or similar) calls `start({ backgroundUrl, name })` with the known patio fields and then navigates. Both the featured card (currently a `<Link>`) and the library card (programmatic `navigate`) route through this helper so trigger logic lives in one place.

- **Deep-link / refresh self-activation:** the provider, on mount, reads the current router location; if the path matches `/patios/$id` and the transition is not already active, it calls `start()` with a dark background (no image/name yet). This paints the overlay before/around the route's suspense window. When the patio query resolves inside the editor module, `update({ backgroundUrl, name })` swaps in the real image and name (crossfade), and the dark background is the fallback until then.

### Fade timing

- Fade-in: ~300ms ease-out, starts immediately on navigation (no delay — the map load is always slow enough that the overlay should always show).
- Fade-out: ~500ms ease-in-out, starts on the ready signal (or timeout/error).
- Minimum display time ~600ms so a fast resolve never flickers the overlay.

### Cesium "ready" signal

- The fade-out trigger is the patio's place being framed and its first LOD settled. After the existing scene bootstrap adds the tileset and frames the camera to the patio bounds, attach a listener to the tileset's `initialTilesLoaded` event (fires once when all view-requested tiles finish their first load). That listener calls the context `finish()`.
- `initialTilesLoaded` is chosen over polling `allTilesLoaded` on `postRender`: same intent, one listener, no per-frame poll.
- A **5-second safety timeout** runs alongside; whichever fires first calls `finish()`, so the overlay can never get stuck if tiles never fully settle.
- Wiring: the scene bootstrap gains an `onReady` callback parameter. The map canvas reads `finish` from the page-transition context and passes it as `onReady`. Teardown removes the tileset listener and clears the timeout.

### Edge handling

- **Query error:** the patio editor (or the query) calls `finish()` immediately on error so the overlay clears and the route's error UI is shown — no waiting for the timeout.
- **Navigate away mid-transition:** the provider resets state (and clears any pending timeout) when the route changes away from `/patios/$id`, so the overlay never lingers on the next page.
- **Patio → patio re-entry:** out of scope. Supported flows are Home → patio and deep-link only.

## Testing Decisions

This repo has **no test runner configured** (per `CLAUDE.md`), and the project convention is not to add one unless explicitly requested. Therefore no automated tests are written for this feature.

Verification is manual, covering the behaviors that matter at the boundary (what the user sees), not implementation details:

- Home featured-card click → overlay fades in immediately with the correct background and `Loading {name}`.
- Home library-card click → same behavior.
- Overlay stays up until the 3D place is visibly framed and its tiles have settled, then fades out.
- Deep-link / hard refresh on `/patios/$id` → overlay appears immediately on a dark background with `Loading…`, then background image and name swap in once data resolves.
- Fast-resolve case does not flicker (min-display guard holds).
- Slow/never-settling tiles → overlay clears after the 5s timeout.
- Patio fetch error → overlay clears and error UI is visible.
- Navigating away before ready → overlay does not linger.

If automated coverage is desired later, the `PageTransition` reducer/state logic (start → update → finish, min-display, timeout, route-away reset) is the deep, framework-agnostic unit worth isolating, since it holds the non-trivial timing rules independent of React/Cesium.

## Out of Scope

- Loading transitions for any route other than `/patios/$id`.
- Patio → patio navigation (re-entry while a patio is already open).
- A global app-wide route transition system; this is scoped to the patio entry flow only.
- Changes to how the Cesium scene is configured or how tiles are fetched, beyond adding the `onReady` ready signal.
- Real patio API (the data layer is currently mocked from fixtures); the transition must simply work with whatever resolve latency the query has.
- Progress percentage / determinate loading bar — the spinner is indeterminate.

## Further Notes

- The Figma reference is node `6658-83482` in the Neos Patio UI Design file: full-bleed photographic background, dark scrim, small centered logo-in-spinner, and a thin white `Loading {place}` label beneath it.
- `previewBackgroundUrl` and `name` already exist on the `Patio` type, so the Home cards have everything they need to populate the overlay at navigation time.
- The logo asset (`src/icons/logo-sm_35.svg`) is a gradient that uses `currentColor`, so the spinner/logo color is controlled by CSS `color`.
- The existing `LoadingSpinner` (conic-gradient ring + mask) is the visual basis for the new branded spinner; reuse its ring rather than reinventing it.
- `motion` (v12, Framer Motion fork) is already used elsewhere (`XRConnectDialog`, `UploadModelFlow`) — follow those `motion.div` + `AnimatePresence` patterns for the fade.
