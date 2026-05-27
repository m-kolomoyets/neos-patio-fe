## What to build

A new proximity-autoplay hook for the FeaturedPatios carousel, wired into the module end-to-end. The carousel is still by default. When the cursor enters the **next** arrow's magnetic zone, the carousel begins advancing forward on its own; the closer the cursor is to the arrow, the faster it advances; leaving the zone stops it.

Proximity comes from the existing `computeMagneticTarget` util (full magnetic radius, unit max-rate) so the autoplay zone is identical to the scrub zone. Speed maps proximity magnitude linearly to an interval (~3000 ms at the zone edge → ~800 ms on the arrow), re-read each cycle so speed responds live. Stepping is a self-rescheduling timer calling embla `scrollNext`; cleared when proximity falls below epsilon.

Gated by the existing `videoCapable` flag (hover pointer, non-slow connection, no reduced-motion) — so no autoplay on touch, slow connections, or reduced-motion.

This slice handles the **forward / next-arrow** direction only.

## Acceptance criteria

- [ ] New hook lives in the FeaturedPatios `hooks/` folder, interface `{ emblaApi, prevRef, nextRef, enabled }`, no React state.
- [ ] Reuses `computeMagneticTarget`; does NOT add the `embla-carousel-autoplay` dependency.
- [ ] Carousel does not move when cursor is outside the magnetic zone (default off).
- [ ] Cursor in the next-arrow zone advances slides forward; interval shrinks (~3000→800 ms) as cursor nears the button.
- [ ] Autoplay stops when cursor leaves the zone.
- [ ] Disabled when `videoCapable` is false (touch, slow connection, reduced-motion).
- [ ] Hook invoked from the module entry alongside existing scrub hooks, passing prev/next refs and `videoCapable`.
- [ ] Existing video scrubs unchanged; while slides animate, video follows slide position via the existing handoff.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
