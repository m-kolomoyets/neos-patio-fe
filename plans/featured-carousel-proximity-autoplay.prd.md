# Featured Carousel — Proximity-Driven Autoplay

## Problem Statement

The FeaturedPatios carousel sits still until the user clicks an arrow or drags. The arrows already feel "alive" via the magnetic video scrub (hovering near an arrow scrubs the in-view video), but the carousel itself never advances on its own. There is no ambient motion that invites the user to keep browsing, and no way to glide through slides hands-free by simply leaning the cursor toward where they want to go.

## Solution

Add autoplay that is **off by default** and governed by the same "magnetic" proximity logic as the existing arrow scrub:

- When the cursor enters an arrow's magnetic zone, the carousel begins advancing on its own.
- The **closer** the cursor is to an arrow, the **faster** it advances (shorter interval between steps).
- Direction follows the arrow: near the **next** arrow it advances **forward**; near the **prev** arrow it advances **backward**.
- Leaving the magnetic zone stops autoplay.

The existing video-scrub behaviors are preserved: while slides animate, video frames follow slide position (viewport-progress scrub); when idle and hovering near an arrow, the magnetic scrub still teases the clip.

## User Stories

1. As a visitor, I want the carousel to stay still by default, so that nothing moves unexpectedly when I'm not interacting with it.
2. As a visitor, I want the carousel to start advancing when I move my cursor near the next arrow, so that I can browse hands-free.
3. As a visitor, I want it to advance faster the closer my cursor gets to the arrow, so that I control pace by intent rather than repeated clicks.
4. As a visitor, I want it to advance more slowly when my cursor is at the outer edge of the magnetic zone, so that speed feels proportional to my proximity.
5. As a visitor, I want autoplay to go backward when my cursor is near the prev arrow, so that the arrows feel directional and natural.
6. As a visitor, I want autoplay to stop as soon as I move my cursor out of the magnetic zone, so that I regain a still carousel without effort.
7. As a visitor, I want videos to keep scrubbing by slide position while autoplay advances slides, so that the motion stays visually coherent.
8. As an idle visitor hovering near an arrow without crossing into autoplay, I want the existing magnetic video tease to still work, so that no prior behavior is lost.
9. As a visitor who grabs and drags the carousel, I want autoplay to pause during the drag and resume after I release (if my cursor is still in the zone), so that manual control always wins.
10. As a touch-device user, I want no autoplay, because there is no cursor proximity to drive it.
11. As a user on a slow connection or with data-saver on, I want no autoplay, consistent with the existing video-capability gating.
12. As a user who prefers reduced motion, I want autoplay disabled, so that the experience respects my OS accessibility setting.
13. As a visitor on a looping carousel, I want backward autoplay near the prev arrow to wrap around correctly, so that motion is continuous.
14. As a visitor whose window resizes, I want the magnetic zones recomputed against the arrows' new positions, so that proximity stays accurate.

## Implementation Decisions

- **New deep module: a proximity-autoplay hook** scoped to the FeaturedPatios folder (`hooks/`). Interface mirrors the existing magnetic scrub hook: `{ emblaApi, prevRef, nextRef, enabled }`. It owns no React state — it runs an effect that listens to pointer movement and schedules slide steps.
- **Reuse the existing `computeMagneticTarget` util** (in `utils/`) as the single source of proximity. Called with the full magnetic radius and a unit max-rate so it returns a **signed proximity value in [−1, 1]**: magnitude = speed, sign = direction (positive → next, negative → prev). This guarantees the autoplay zone is identical to the scrub zone.
- **Custom scheduler, NOT the `embla-carousel-autoplay` plugin.** Verified from the plugin source that its tick calls `goToNext` only — direction is not configurable and there is no tick-override hook — so the plugin cannot satisfy the directional requirement. No new dependency is added.
- **Speed model:** linear map from proximity magnitude to interval. At the zone edge the interval is long (lazy drift, ~3000 ms); cursor on the arrow gives a short interval (brisk, ~800 ms). The interval is re-read each cycle so speed responds live as the cursor moves. (Proximity itself already has quadratic falloff from the shared util.)
- **Stepping:** a self-rescheduling timer that calls embla's `scrollNext` / `scrollPrev` based on the current sign. Active only while proximity magnitude exceeds a small epsilon; otherwise the timer is cleared (the default off state).
- **Drag handling:** pause stepping on embla's pointer-down, resume on pointer-up — manual interaction takes precedence.
- **No changes to the existing scrub hooks.** The established `isScrolling` handoff already hands video `currentTime` ownership to the viewport-progress scrub while slides animate and yields the magnetic scrub; autoplay's `scrollNext`/`scrollPrev` calls trigger embla's existing `scroll`/`settle` events that drive that handoff. Coexistence is achieved without coupling.
- **Gating:** autoplay is enabled under the same `videoCapable` condition as the magnetic scrub — requires hover-capable pointer, a non-slow connection, and no reduced-motion preference. On touch there is no cursor proximity, so this gate is also functionally correct.
- **Center tracking:** arrow centers are cached and refreshed on resize and embla re-init, matching the magnetic scrub hook's pattern, so proximity math stays accurate.
- **Wire-up:** the new hook is invoked once from the FeaturedPatios module entry alongside the existing scrub hooks, passing the existing prev/next button refs and the `videoCapable` flag.

## Testing Decisions

- **No automated test runner exists in this repo** (per project conventions, none is configured and none should be introduced unsolicited). Therefore validation is manual + static.
- **Static checks:** `npm run tsc` (type-check) and `npm run lint` (eslint, stylelint, prettier) must pass.
- **Good test = external behavior, not internals.** Were a unit test layer introduced later, the natural seam is the pure proximity→(direction, interval) mapping — it takes cursor coordinates plus arrow centers and returns a signed magnitude and a derived delay, with no DOM or embla dependency. That logic should be exercised in isolation; the scheduler/effect wiring should not.
- **Manual verification matrix:**
  - Default: cursor far from arrows → no movement.
  - Enter next-arrow zone → advances forward; speed visibly increases as cursor nears the button, decreases toward the edge.
  - Enter prev-arrow zone → advances backward.
  - Leave zone → stops.
  - During autoplay, videos scrub by slide position; idle hover near an arrow still teases via magnetic scrub.
  - Drag the carousel → autoplay pauses, resumes on release.
  - OS reduce-motion on → no autoplay. Touch device → no autoplay.
- **Edge cases:** backward wrap-around on a looping carousel; overlapping zones near both arrows cancel (signed sum, inherited from the shared util); window resize recomputes centers; rapid cursor entry/exit does not leave a dangling timer.

## Out of Scope

- Replacing or modifying the existing magnetic video scrub or viewport-progress scrub behaviors.
- Any UI affordance/indicator that autoplay is active (no play/pause button, no progress ring).
- Keyboard- or focus-driven autoplay (proximity is cursor-only by design).
- Touch / mobile autoplay.
- Adding the `embla-carousel-autoplay` dependency or any new package.
- Configurable speed bounds exposed to consumers (the module takes no props beyond the standard carousel wiring).
- Introducing a test runner.

## Further Notes

- Speed-bound constants (edge ~3000 ms, button ~800 ms) and the magnetic radius are starting values matched to the existing scrub hook; they are tuning knobs and may be adjusted by feel during implementation.
- Because proximity is computed by the shared `computeMagneticTarget`, the autoplay zone and the scrub zone will always stay in sync if the radius is later changed in one place — worth keeping the radius constant shared or mirrored deliberately.
- The non-reduced-motion carousel options already set `loop: true`, which backward autoplay relies on for wrap-around; the reduced-motion path disables autoplay via the gate, so its `loop: false` is irrelevant here.
