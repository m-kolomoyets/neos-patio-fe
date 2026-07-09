## What to build

Promote the ViewCube widget to a shared component and render it on both the editor and the view page.

- Move `ViewCube` (with its hooks/utils/subcomponents) → shared `src/components/ViewCube/`.
- Break its three editor-internal couplings: `bounds` and `storageId` (the patio id, used for the home-view localStorage key) become **props**; the Cesium viewer and orbit target come from the now-shared viewer context and orbit hook.
- Editor's shell passes `bounds` + `storageId={id}`; View's shell passes the same from its patio query.

## Acceptance criteria

- [ ] ViewCube renders bottom-right on both `/patios/<id>/edit` and `/patios/<id>/`.
- [ ] ViewCube reorients the camera and jumps to preset views on both routes.
- [ ] Home-view persistence keys correctly by patio id (via `storageId` prop) on both routes.
- [ ] No shared ViewCube code imports from `src/modules/PatioEditor/*`.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #plans/patio-view/02-promote-cesium-shared.issue.md
- View-side rendering also needs #plans/patio-view/03-view-map-viewonly-loader.issue.md
</content>
