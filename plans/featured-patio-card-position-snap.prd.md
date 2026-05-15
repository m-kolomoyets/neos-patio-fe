# FeaturedPatioCard — Position-Snap Video Parallax

## Problem Statement

Featured patios carousel currently shifts each card's media horizontally (`--tx`) as the user scrolls, then independently scrubs the video on hover. Visual effect is a generic x-parallax that does not communicate the carousel position, and video stays hidden until a user hovers a specific card. Users scrolling without hovering never see the video preview — the most descriptive asset of a patio. We also pay parallax cost on every card regardless of viewport visibility.

## Solution

Replace the per-card x-translate parallax with a position-driven video frame snap. As a card moves across the viewport, its video seeks to a frame mapped from its position (left edge → frame 0, center → middle, right edge → end). Once a card's video is mounted and metadata is loaded, the video layer becomes visible and replaces the image. Hover continues to scrub the video by pointer; on pointer leave, the video eases back to the position-snap frame instead of frame 0. Cards outside a small visible window around the viewport keep showing the still image — no video element mounted.

## User Stories

1. As a homepage visitor, I want each featured card's preview video to advance as I scroll the carousel, so that scrolling itself reveals the patio in motion.
2. As a homepage visitor, I want the card at the left edge of the viewport to show an early frame of its video, so that the snap direction matches the scroll direction I'm reading.
3. As a homepage visitor, I want the card at the right edge of the viewport to show a late frame of its video, so that snap progression is consistent across cards.
4. As a homepage visitor, I want the centered card to show the middle frame, so that the snap feels symmetric around the focal card.
5. As a homepage visitor, I want hovering a card to continue scrubbing its video by pointer position, so that I retain the existing hover-scrub interaction.
6. As a homepage visitor, I want releasing hover to ease the video back to its position-mapped frame, so that the card returns to the scroll-aligned state instead of jumping to frame 0.
7. As a homepage visitor, I want the video to appear seamlessly once it is ready, so that I don't see a flash from frame 0 to the position frame.
8. As a homepage visitor, I want cards outside the visible region to keep showing the still image, so that scrolling stays smooth without unbounded video elements.
9. As a homepage visitor, I want one card on each side of the visible region to also have its video preloaded, so that fast scrolling does not constantly show stills snapping to video.
10. As a homepage visitor on a slow connection, I want the carousel to remain image-only, so that limited bandwidth is not consumed by previews.
11. As a homepage visitor with `prefers-reduced-motion`, I want no scroll-driven snap and no hover scrub, so that motion sensitivity preferences are respected.
12. As a homepage visitor on a touch device, I want the carousel to behave as image-only (no hover scrub), so that the experience matches the current touch path.
13. As a homepage visitor, I want the hover vertical micro-shift (`--ty`) to keep working, so that the existing hover feel is unchanged.
14. As a homepage visitor, I want first and last cards at scroll extremes to clamp to frame 0 and frame end respectively, so that edge behavior is consistent with the center rule.
15. As a homepage visitor, I want the video to remain paused at all times and update via seeking only, so that there's no audio risk and frame mapping is exact.
16. As a homepage visitor, I want each card's video to fetch as a blob once and stay cached for the lifetime of the page, so that re-entering the visible window does not refetch.
17. As a homepage visitor, I want broken videos to fall back to the still image silently, so that one bad asset never breaks the carousel.
18. As a developer, I want the snap math to live in a single parent hook that already measures scroll geometry, so that there is one scroll listener for the carousel.
19. As a developer, I want per-card hover/scrub state to remain encapsulated in the card hook, so that hover concerns stay local.
20. As a developer, I want a clean precedence rule between scroll-snap and hover, so that the two never fight over `video.currentTime`.

## Implementation Decisions

### Modules

- **Carousel parallax hook** (parent, existing). Continues to own scroll measurement. Drops `--tx` CSS variable writes. Computes a normalized position `n ∈ [-1, 1]` per card and a snap value `s = (n + 1) / 2`. Exposes per-card snap value to the card via a registry callback (card registers `(stack, onSnap)` on mount; parent invokes `onSnap(s)` per scroll rAF for that card only when value changes).
- **Card hover-scrub hook** (per-card, existing). Renamed conceptually to combine snap + hover. Accepts the parent's snap stream. Owns:
  - mounting the `<video>` once the parent says the card is in the visible window (visible ± 1 neighbor),
  - blob fetch on first mount,
  - `onLoadedMetadata` initial seek to the current snap value,
  - per-scroll-rAF seek to `s * duration` when not hovered and not in rewind,
  - hover scrub (unchanged math, unchanged Y-shift),
  - leave-rewind whose target time is the live snap value (eased over the existing 500ms `easeOutCubic`),
  - error → broken phase → image fallback.
- **Featured patios container** (parent component, existing). Extends its IntersectionObserver to also drive a "render window" (visible card IDs plus one neighbor on each side). Passes a `shouldMountVideo` prop down to each card. The existing `shouldPrefetch` becomes equivalent to "in render window".
- **Card component** (existing). Drops consumption of `--tx`. Reads `shouldMountVideo` from parent. Keeps the layered stack: `img-low`, `img-high`, `video`. Video sits at `z: 3` and becomes opaque whenever metadata is ready and the card is in the render window.
- **Card styles** (existing). Removes `--tx` from `.stack` transform; keeps `--ty`. `.video[data-active]` semantics: active when metadata is ready (no longer hover-only).

### Behavior contracts

- **Position → frame mapping**: `n = clamp((cardCenter − viewportCenter) / (viewportWidth / 2), −1, 1)`; `s = (n + 1) / 2`; `targetTime = s × duration`. Linear, clamped at extremes. No per-card range normalization.
- **Update rate**: snap value is recomputed in the parent's scroll rAF (one rAF for the whole carousel). The card writes `video.currentTime = targetTime` only when not in `seeking`, not hovered, not in `rewinding`, and metadata is ready.
- **Precedence**: when card phase is `loading`, `active`, or `rewinding`, hover hook owns `currentTime`. When phase is `idle`, scroll-snap owns `currentTime`. `broken` phase suppresses all writes.
- **Leave-rewind target**: the live snap value at each rewind tick (re-read each frame so concurrent scroll during the 500ms rewind keeps the target current).
- **Initial seek**: on `onLoadedMetadata`, set `video.currentTime` to the current snap value before flipping video to visible.
- **Render window**: visible cards (IntersectionObserver `threshold: 0`, `root: viewport`) plus one neighbor on each side, computed in the parent (same index map already used by `prefetchIds`). Outside this window → `shouldMountVideo = false` → video unmounts → image visible. Edge cards have one neighbor (or zero at ends).
- **Capability gates**: `prefers-reduced-motion: reduce` OR `isSlowConnection()` → never mount video, no snap writes, image-only path. Hover scrub also disabled in these cases (already true today for reduced motion).
- **Hover Y-shift**: unchanged — `MAX_Y_PX = 24`, same easing, same `--ty` write.
- **Edge clamp**: first/last cards use the same `n` clamp; their snap value may never sweep the full `[0, 1]` range if `cardWidth < viewportWidth / 2`. Accepted.
- **Blob fetch**: per card, keyed by `videoUrl`. Re-entry into the render window after unmount re-fetches but the browser HTTP cache should serve from disk; no centralized blob registry.
- **Playback**: video always paused. `loop={false}`, `muted`, `playsInline`, `preload="auto"`, no `play()` calls.

### Parent → card data flow

- Parent owns: render window set, per-card snap value, scroll rAF.
- Card registers itself with the parent (on mount, when `shouldMountVideo` is true). Registration includes a `setSnap(s: number)` callback.
- Parent calls `setSnap(s)` only when the value changes for that card.
- Card unregisters on unmount.

### Phase model

Existing card phases (`idle`, `loading`, `active`, `rewinding`, `broken`) reused. The visual rule "image visible vs video visible" becomes:

- Video visible when card is in render window and metadata is ready, regardless of phase (except `broken`).
- During `broken`, image visible, video hidden.

## Testing Decisions

No test runner is configured in this repository (per `CLAUDE.md`). No tests will be added as part of this change.

Manual verification checklist for the implementer:

- Scroll the carousel slowly: each card's video frame advances monotonically with its center position; left-of-viewport card sits near frame 0, right-of-viewport card sits near final frame.
- Stop mid-scroll: each visible card holds its frame, paused.
- Hover a card while scrolling: hover scrub takes over (`currentTime` driven by pointer X), Y-shift visible.
- Release hover while still scrolling: video eases back to the live snap value, not frame 0.
- Release hover after scrolling has stopped: video eases back to the static snap frame.
- Scroll a card out of viewport ± 1 neighbor: video element unmounts; image high replaces it without flash.
- Scroll the same card back in: video re-mounts, fetches blob (or uses HTTP cache), seeks to current snap value, becomes visible only once metadata is ready.
- Toggle OS `prefers-reduced-motion: reduce`: no video mounts, image only, no scroll-driven seek.
- Simulate `connection.effectiveType = "2g"` / `saveData`: image-only path.
- Break the video URL (404): card falls back to image, no console error storm, neighbors unaffected.
- Resize window: snap continues to map correctly using the new geometry.
- Reach the carousel's left/right scroll extremes: edge cards clamp without jitter.

## Out of Scope

- Tests / test infrastructure.
- Refactoring the `PatioLibraryCard` parallax hook.
- Audio (videos remain muted; no audio in scope).
- Centralized blob URL cache shared across cards or sessions.
- Per-card range normalization that forces every card to sweep the full `[0, 1]` regardless of card width.
- Blended hover + scroll currentTime (single-owner precedence chosen instead).
- Crossfade animation between image and video layer (instant swap once metadata ready).
- Changes to the carousel's scroll-snap behavior, button paging, or sticky header logic.

## Further Notes

- The existing `shouldPrefetch` boolean and the render-window concept collapse into one signal (`shouldMountVideo`). The parent's `prefetchIds` Set becomes the source of truth.
- Because the parent already runs an `IntersectionObserver` against the viewport, no new observer is needed — extending the existing `intersectingIds` → `prefetchIds` derivation is sufficient.
- Snap value can be delivered to the card either via direct callback registration or via a CSS variable on the stack (`--snap-t`) read by a per-card rAF. Callback registration is preferred: avoids a per-card rAF and avoids reading style values for math.
- `MAX_X_PX` constant disappears with the removal of `--tx`. `MAX_Y_PX` stays.
- The card hook's `onPointerLeave` rewind tick should read snap value from a ref kept up-to-date by the parent's `setSnap` callback, so the rewind target stays live.
- Watch out for the `seeking` flag during fast scroll: skip the write when the previous seek hasn't completed. The browser will keep the most recent target on the next idle tick.
- The `prefersReducedMotion` and slow-connection checks should be hoisted to the parent so the card hook can stay purely about behavior given the gate decision.
