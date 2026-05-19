# Featured Patios — Embla Carousel Migration

## Problem Statement

The Featured Patios section on the home page is built on a native horizontal scroll container wrapped in `ScrollArea`, with a hand-rolled scroll-snap parallax hook, an `IntersectionObserver` that mounts videos for visible cards, and chevron arrows that page through cards by measuring `scrollLeft` against card offsets. The implementation has grown noisy: scroll-edge state, RAF throttling, observer setup/teardown, snap registration callbacks on every card, and arrow disabled state are all stitched together by hand. It does not loop, has no progress indicator, and the parallax/video logic is coupled to native scroll mechanics that are awkward to extend.

## Solution

Replace the native scroll implementation with `embla-carousel-react`. Use an infinite loop, expose progress through a dot row anchored at the bottom of the viewport, and route the existing chevron arrows through Embla's navigation API. Port the parallax and "mount videos for visible neighbors" behaviors onto Embla's native events (`scroll`, `slidesInView`) so the carousel becomes the single source of truth for navigation, snap state, and visibility, and the surrounding component shrinks to composition only.

## User Stories

1. As a homepage visitor, I want to swipe or drag through featured patios continuously without hitting a hard edge, so that browsing feels smooth and discoverable.
2. As a homepage visitor, I want to see dots at the bottom of the carousel indicating how many featured patios exist and which one is currently active, so that I can orient myself within the set.
3. As a homepage visitor, I want to click any dot to jump directly to that featured patio, so that I can skip ahead without paging one card at a time.
4. As a homepage visitor, I want the existing left/right arrows to advance the carousel by one card, so that I have a discrete navigation option alongside drag.
5. As a homepage visitor using a mouse/keyboard, I want the arrows to never become disabled in loop mode, so that I can keep navigating in either direction indefinitely.
6. As a homepage visitor with `prefers-reduced-motion`, I want snap transitions to be instant, looping to be disabled, and parallax/video effects to be skipped, so that the section respects my motion preferences.
7. As a homepage visitor on a slow connection or touch-only device, I want videos to stay unmounted, so that I am not charged for media I cannot meaningfully consume.
8. As a homepage visitor, I want the card currently in view (and its immediate neighbors) to mount their video, so that scrolling forward or back feels instantaneous without paying the cost of mounting every video at once.
9. As a homepage visitor, I want a subtle parallax effect on the card media as I drag, so that the carousel feels tactile.
10. As a screen reader user, I want the carousel to be announced as a carousel region with a meaningful label, so that I can navigate to it via landmarks.
11. As a screen reader user, I want each slide to be announced as "slide N of M" with the patio context, so that I know my position.
12. As a screen reader user, I want the dot buttons to announce which slide they target and which dot represents the current slide, so that I can use them as a navigation aid.
13. As a keyboard user, I want the existing "Go to search bar" skip button to remain in place and unaffected, so that I can bypass the carousel.
14. As a homepage visitor on a single-featured-patio day, I want the dots and arrows to be hidden when only one slide exists, so that the UI does not show meaningless controls.
15. As a developer, I want one hook to own Embla initialization, lifecycle, and exposed API, so that the section component reads as composition rather than wiring.
16. As a developer, I want the parallax hook to consume Embla's `scrollProgress` and `slideNodes` rather than reading `scrollLeft` and a manual snap registry, so that the registration callback can be removed from `FeaturedPatioCard`.
17. As a developer, I want the "visible + neighbors" video render-window to be derived from `emblaApi.slidesInView()`, so that the `IntersectionObserver` and `intersectingIds` state can be deleted.
18. As a developer, I want the carousel to `reInit` automatically when the underlying data changes, so that skeleton-to-data transitions do not leave Embla with stale slide counts.
19. As a developer, I want dots scoped to the Featured Patios module rather than promoted to `components/ui` until reuse demands it, so that the surface area stays small.
20. As a developer, I want the `ScrollArea` wrapper removed from this section, so that there is no conflict between native overflow scrolling and Embla's transform-based viewport.

## Implementation Decisions

### Modules

- **`useFeaturedCarousel` hook** — new, module-scoped under `FeaturedPatios/hooks/`. Owns `useEmblaCarousel` setup, options derivation from `prefers-reduced-motion`, `reInit` on data change, and exposes a deep, stable interface: `emblaRef`, `emblaApi`, `selectedIndex`, `snapList`, `scrollPrev`, `scrollNext`, `scrollTo`, plus `slidesInViewWithNeighbors` (a `ReadonlySet<number>` of indices to render media for). The internal Embla API stays encapsulated; consumers see only the interface above.
- **`useCarouselParallax` hook** — rewritten in place. New signature consumes `emblaApi` (and optionally `enabled` for reduced-motion). Subscribes to `emblaApi.on('scroll', ...)` and `on('reInit', ...)`, reads `scrollProgress()` and `slideNodes()`, and applies per-slide transforms directly. The `registerSnap` callback is deleted and removed from `FeaturedPatioCard`'s props.
- **`CarouselDots` sub-component** — new, scoped under `FeaturedPatios/components/CarouselDots/`. Stateless: receives `count`, `selectedIndex`, `onSelect(index)`. Renders a row of `<button>` elements with `aria-label="Go to slide N"` and `aria-current="true"` on the active dot. Absolute-positioned overlay anchored to the bottom of the viewport. Hidden when `count <= 1`.
- **`FeaturedPatios` (index)** — slimmed to composition. Owns the query, the data-driven `reInit` effect (delegated to the hook), and renders viewport → track → slides → dots + arrows. Loses: `viewportRef` scroll listeners, `canScrollLeft/Right` state, RAF throttling, `IntersectionObserver`, `intersectingIds`, `renderWindowIds` memo, `scrollByPage`, `staticCapable`/`videoCapable` state (the reduced-motion + capability checks move into `useFeaturedCarousel`'s options derivation; `videoCapable` is computed from the same inputs and gates `slidesInViewWithNeighbors`).
- **`FeaturedPatioCard`** — minor: drop the `registerSnap` prop from its public type and stop calling it. No visual change.

### Embla configuration

- Base options: `{ loop: true, align: 'start', dragFree: false, containScroll: 'trimSnaps' }` (the latter is ignored in loop mode but kept for the reduced-motion fallback).
- Reduced-motion overrides: `{ loop: false, duration: 0 }`. Parallax and video-mount paths are short-circuited in this mode.
- Slow-connection / no-hover devices: parallax stays on (cheap transform), video-mount stays off.

### Arrows

- Existing chevron buttons keep their position, styling, and `sr-only` labels.
- `onClick` wired to `scrollPrev` / `scrollNext`.
- `disabled` prop and `canScrollLeft/Right` state removed entirely (loop mode is always navigable).
- `aria-controls={viewportId}` added; viewport gets a stable `id`.

### Dots

- One dot per snap in `scrollSnapList()` (1:1 with slides given `slidesToScroll: 1`).
- Active dot signalled via a `data-active` attribute and `aria-current="true"`; styled via CSS (no inline width animation logic in JS).
- Click → `scrollTo(index)`. Keyboard: native `<button>` semantics, no custom handlers.
- Hidden when `snapList.length <= 1`.

### A11y contract

- Viewport: `role="region"`, `aria-roledescription="carousel"`, `aria-label="Featured patios"`, stable `id`.
- Each slide wrapper: `role="group"`, `aria-roledescription="slide"`, `aria-label="{n} of {m}"`.
- Dots: `<button aria-label="Go to slide {n}">`, active gets `aria-current="true"`.
- Arrows: existing `sr-only` text retained; `aria-controls` added.
- No `aria-live` on the track — drag and auto-snap would spam SR announcements.

### Data lifecycle

- `useQuery(getFeaturedPatiosQueryOptions())` unchanged.
- Skeletons (3 placeholder slides) render inside the track while `isLoading`; dots and arrows hidden until real data arrives.
- `useFeaturedCarousel` calls `emblaApi.reInit()` whenever the data identity changes, so the snap list updates after skeleton → data swap.

### Dependencies

- Add `embla-carousel-react` (latest 8.x) via `npm`, audited with the `npm-audit-install` skill prior to install. No plugins (no autoplay, no class-names plugin).

### Files removed / unused after migration

- `ScrollArea` import and wrapper in this section (the component itself stays for other consumers).
- The bulk of `FeaturedPatios/index.tsx`'s effects and state listed in the module summary above.
- `registerSnap` from `FeaturedPatioCard`'s prop surface.

## Testing Decisions

This repository has no test runner configured (per `CLAUDE.md`) and the brief did not request introducing one. Verification will therefore be manual and tooling-based rather than test-suite-based:

- `npm run tsc` — type-check the new hook signatures, the removal of `registerSnap`, and the dots component contract.
- `npm run lint` — eslint, stylelint, prettier in sequence; expected to pass with no new disables.
- Manual browser pass via `npm run dev` against the home route:
  - Drag, arrow navigation, and dot navigation each advance the selected index correctly and the active dot tracks the visible slide.
  - Looping is seamless in both directions; arrows never appear disabled.
  - Reduced-motion mode (DevTools emulation) disables looping and snaps instantly; parallax and video both skip.
  - Slow-connection emulation keeps videos unmounted; parallax still applies.
  - Single-slide data (mock by trimming the query result temporarily) hides dots and arrows.
  - Screen reader spot-check (VoiceOver) on the region label, slide labels, and dot labels.
  - Skeleton → data transition does not leave Embla with stale snap counts (verify via the dot count matching `data.length` after load).

What makes a good check here is whether the externally-observable behavior of the section matches the user stories above; the internal switch from native scroll to Embla should be invisible to a user other than the new dots and the looping behavior.

## Out of Scope

- Autoplay (explicitly declined).
- Promoting `CarouselDots` to `components/ui/` — deferred until a second consumer exists.
- Changes to `FeaturedPatioCard` beyond removing the `registerSnap` prop.
- Changes to the data layer (`services/patios`).
- Introducing a test runner or unit tests.
- Restyling the dots beyond a minimal row with an active-state treatment.
- Replacing or restyling the chevron icons or the skip button.

## Further Notes

- The dots overlay sits over card media at the bottom of the viewport. If legibility against bright imagery becomes an issue, a subtle bottom scrim can be added to the viewport (out of scope for the initial migration unless flagged during review).
- Embla's `loop: true` clones edge slides; on extremely small data sets this is harmless but worth noting if the data shape ever becomes a single item — the `count <= 1` guard already covers the UX side.
- The parallax port should keep transform writes inside the `scroll` handler (Embla already rAF-batches its own internals); avoid layering another RAF on top.
- `useFeaturedCarousel` is the natural seam for any future plugin adoption (autoplay, wheel-gestures); keeping all options derivation in one place makes that change a one-file edit.
