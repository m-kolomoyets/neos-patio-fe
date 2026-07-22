## What to build

Replace the single flat blue used for every patio with the design system's `Indicator` palette, and
give squares real interaction states.

Data:

- Add `ownerAddress?: string` to `Patio`; populate it on a few fixtures (including one matching a
  test wallet) so all four types are reachable.
- Add `isMine: boolean` to `PatioPointProperties`, derived in a `useMemo` over `usePatioPoints()` +
  `useAccount().address`. The GeoJSON identity changes when the wallet connects, disconnects, or
  switches account, so the `<Source>` data updates automatically.

Type resolution — one pure helper shared by squares and badges:

| | published | not published |
|---|---|---|
| **not mine** | `owned` — green | `not-published` — blue |
| **mine** | `owned-and-published` — orange | `owned-and-not-published` — yellow |

Plus `target` (dark orange) for the create-mode center cursor, which keeps its current appearance.

Rendering:

- **Patio squares** and **singleton badges** both use the full four-color palette, so the
  badge→square morph across `MORPH_BAND` is a pure shape change with no color jump.
- **Clusters stay two-color**: blue when the existing `hasUnpublished` aggregate is true, green
  otherwise. Do **not** aggregate ownership into `clusterProperties`.
- Palettes live in `constants.ts` alongside the existing `CENTER_SQUARE` / `PATIO_SQUARE`, one entry
  per type with the `default` / `hovered` / `pressed` treatments from the Figma component.

Interaction states — driven **imperatively**, matching the existing driver pattern, no React state
and no per-frame re-render:

- A map `mousemove` handler reuses `isPointInSquare` (same hit-test as `useSelectPatioOnClick`) and
  writes `data-state="hovered"` on the matching rect, clearing the previous one. Throttle to `render`
  frames. Set `cursor: pointer` on the canvas while over a square.
- `mousedown` / `mouseup` write and clear `pressed`.
- There is no `selected` variant in the design system, so **selected reuses the `pressed` visual**
  and is sticky until deselected.
- Precedence: `selected` > `pressed` > `hovered` > `default`.

Note `SquaresOverlay` is `pointer-events: none` and stays that way — all hit-testing remains at the
map level; the SVG never receives pointer events itself.

## Acceptance criteria

- [ ] `Patio.ownerAddress` and `PatioPointProperties.isMine` exist; fixtures cover all four types.
- [ ] A single pure helper maps `(isPublished, isMine)` to a type; squares and badges both use it.
- [ ] Squares render green / blue / orange / yellow per the 2×2 table.
- [ ] Singleton badges use the same four colors; morphing from badge to square shows no color change.
- [ ] Clusters are blue when they contain any unpublished member, green otherwise.
- [ ] Connecting, disconnecting, or switching account re-colors owned patios without a reload.
- [ ] Hovering a square paints the hovered treatment and shows a pointer cursor; leaving clears it.
- [ ] Pressing a square paints the pressed treatment; releasing clears it.
- [ ] The selected patio stays visually marked (pressed treatment) after the camera settles, and
      precedence holds when hovering a non-selected square.
- [ ] Hover/press cause no React re-render of `SquaresOverlay` (verify via react-scan / profiler).
- [ ] `SquaresOverlay` remains `pointer-events: none`.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-view-mode-default-create-entry
