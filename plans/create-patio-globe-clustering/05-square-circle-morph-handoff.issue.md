## What to build

The literal geometric square↔circle tween, and a clean handoff with the existing `SquaresOverlay`.

- Across the morph band **z14 → z17** (named constants), each **individual** patio marker interpolates:
  - `border-radius`: 0% (square) at z17 → 50% (circle) at z14.
  - size: the geo-accurate footprint (meters→px via the existing `metersToPixels`) at z17 → the fixed
    circle size (42/48px) at z14.
- Below z14 markers are settled fixed circles; above z17 they are full geo-accurate squares. Clusters
  (N→1 merges below `clusterMaxZoom = 13`) are **not** tweened — they appear/disappear via scale/fade
  (already the case from #03).
- Drive the morph from a lightweight `render`-event handler writing CSS custom properties / transform
  on the marker elements — **no per-frame React re-render**. A pure zoom→progress helper (clamped at
  both band ends) maps zoom to `[0,1]`.
- **Handoff**: individual patio markers keep stable supercluster **leaf ids** so the tween animates
  the same element across frames. The existing `SquaresOverlay` remains the source of truth at
  z ≥ 17 (collision/reposition); ensure no double-render at the boundary — one representation of a
  given patio on screen at any zoom.
- **New create-patio marker**: the orange center marker morphs square↔circle across the same band, as
  its own always-on-top overlay element; it is **never** part of the cluster source and never merges
  into a bubble.

## Acceptance criteria

- [ ] Individual patio markers visibly tween border-radius and size across z14–17 (square ⇄ circle).
- [ ] At z ≥ 17 a patio is a full geo-accurate square; at z ≤ 14 it is a fixed-size circle.
- [ ] No patio is rendered twice at the SquaresOverlay ↔ marker boundary.
- [ ] The morph is driven via CSS/transform on a `render` handler; there is no per-frame React
      re-render, and the zoom→progress mapping is a pure, clamped helper.
- [ ] The orange create-patio marker morphs square↔circle, stays on top, and never joins a cluster.
- [ ] With `prefers-reduced-motion`, the morph snaps between square and circle instead of tweening.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #03-cluster-singleton-dom-markers
