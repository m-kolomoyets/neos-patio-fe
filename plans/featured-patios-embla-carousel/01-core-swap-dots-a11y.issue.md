## What to build

Replace the Featured Patios native-scroll implementation with an `embla-carousel-react` looped carousel that includes a dot row, working arrows, full a11y wiring, and reduced-motion handling. This is the tracer-bullet slice: after it ships, the section is a complete, demoable looped carousel — only parallax and the visible-neighbors video render-window are temporarily simplified (handled by follow-up slices).

End-to-end behavior:

- Drag, arrows, and dots all advance the carousel; in loop mode the arrows never disable and wrap seamlessly.
- A dot row sits absolute-positioned over the bottom of the viewport, one dot per slide, with the active dot marked.
- Single-slide data hides both arrows and dots.
- Skeleton → data transitions update the snap list via `emblaApi.reInit()`.
- Reduced-motion users get no looping, instant snaps, and no video mount.
- Screen readers announce the region, each slide's position, and dot targets.
- The skip-to-search-bar button is untouched.
- Videos either all mount (when `videoCapable`) or none — a deliberate temporary simplification; the per-card neighbor-window comes back in slice 3.
- Parallax is disabled in this slice; restored in slice 2.
- `registerSnap` is removed from `FeaturedPatioCard`'s prop surface now so card API does not churn again later.

## Acceptance criteria

- [ ] `embla-carousel-react` added to `package.json` after running the `npm-audit-install` skill, no plugin packages added.
- [ ] `ScrollArea` import and wrapper removed from `FeaturedPatios/index.tsx`; the component itself remains for other consumers.
- [ ] `useFeaturedCarousel` hook exists under `FeaturedPatios/hooks/` and owns Embla init, options derivation from `prefers-reduced-motion`, `reInit` on data identity change, and exposes `emblaRef`, `emblaApi`, `selectedIndex`, `snapList`, `scrollPrev`, `scrollNext`, `scrollTo`.
- [ ] Embla configured with `{ loop: true, align: 'start', dragFree: false, containScroll: 'trimSnaps' }` in the default path and `{ loop: false, duration: 0 }` overrides under `prefers-reduced-motion`.
- [ ] Existing chevron arrows call `scrollPrev` / `scrollNext`; their `disabled` prop and the `canScrollLeft`/`canScrollRight` state are gone.
- [ ] New `CarouselDots` component lives under `FeaturedPatios/components/CarouselDots/` (scoped), is stateless, takes `count` / `selectedIndex` / `onSelect`, renders `<button>` elements with `aria-label="Go to slide N"` and `aria-current="true"` on the active dot, and is absolute-positioned over the viewport bottom.
- [ ] Dots and arrows are hidden when `snapList.length <= 1`.
- [ ] Viewport element has `role="region"`, `aria-roledescription="carousel"`, `aria-label="Featured patios"`, and a stable `id`; arrows reference it via `aria-controls`.
- [ ] Each slide wrapper has `role="group"`, `aria-roledescription="slide"`, and `aria-label="{n} of {m}"`. No `aria-live` on the track.
- [ ] `FeaturedPatioCard` no longer accepts a `registerSnap` prop; the prop is removed from its type and all call sites.
- [ ] `index.tsx` no longer contains: `viewportRef` scroll listeners, RAF throttling for scroll edges, `IntersectionObserver` setup, `intersectingIds` / `renderWindowIds` state, `scrollByPage`. Video mount in this slice is a single boolean (`videoCapable` ? true : false) passed to all cards.
- [ ] Skeleton loaders still render inside the track during `isLoading`; dots/arrows stay hidden until real data arrives; `emblaApi.reInit()` fires on data identity change.
- [ ] `npm run tsc` and `npm run lint` pass with no new disables.
- [ ] Manual browser check on the home route confirms: drag works, arrows wrap in loop mode, dot click jumps to slide, active dot tracks selection, reduced-motion emulation snaps instantly and disables looping, single-slide mock hides dots/arrows.

## Blocked by

None - can start immediately.
