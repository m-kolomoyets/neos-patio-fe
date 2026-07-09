## What to build

Promote the editor's Cesium map and its camera/orbit dependencies to shared locations so both editor and (later) view use one source of truth. Pure refactor — editor behavior must not change.

- Move `MapCanvas` → shared `CesiumMap` component (keep `sceneBootstrap`/`configureViewer` utils with it). Add an `interaction: 'edit' | 'view'` prop (default `'edit'`); `'edit'` preserves today's behavior, `'view'` wiring is added but only exercised by the view slice.
- Move `CesiumViewerContext` → shared context.
- Move `useOrbitTarget` and `useIdleRotation` → shared hooks.
- Extract `sampleSurfaceHeight` to a shared util so shared code never imports from the editor module; leave the rest of the editor's geo-placement logic in the editor, re-pointed at the extracted helper.
- Update all editor imports to the new shared paths.

## Acceptance criteria

- [ ] Editor at `/patios/<id>/edit` works identically to before: map frames the patio, objects place/edit, idle rotation runs, viewcube works.
- [ ] `CesiumMap` accepts `interaction` prop; `'edit'` path unchanged.
- [ ] No shared module imports from `src/modules/PatioEditor/*`.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
</content>
