## What to build

Foundation layer for the XR Connect feature: a generic `ui/Dialog` compound primitive wrapping `@base-ui/react/dialog`, plus the `src/services/xr/` mock service that produces a 6-digit pairing code.

The Dialog primitive exposes the standard Base UI compound parts (Root, Trigger, Portal, Backdrop, Popup, Title, Description, Close), styled with repo design tokens — `surface-thicker` glass background, dimmed backdrop, generous border radius, fade+scale enter/exit driven by Base UI `data-state` CSS transitions. Base UI prop types are re-exported from `types.ts`.

The XR service follows the repo's service convention (`api.ts`, `queryKeys.ts`, `queries.ts`, `types.ts`). The mock `generateXRLoginCode` resolves after ~1200ms with `{ code: string }` of six random digits. `getXRLoginCodeQueryOptions()` factory sets `staleTime: 0` and `gcTime: 0`. Query key factory is hierarchical, matching `patios`.

No consumer is wired up in this slice. Verification is by ad-hoc mounting in a route or scratch component.

## Acceptance criteria

- [ ] `src/components/ui/Dialog/` exists with `index.tsx`, `styles.module.css`, `types.ts`
- [ ] Dialog primitive exposes compound parts: Root, Trigger, Portal, Backdrop, Popup, Title, Description, Close
- [ ] Dialog popup uses `surface-thicker` token, dim backdrop, fade+scale CSS transitions via `data-state`
- [ ] Base UI Dialog prop types re-exported from `types.ts`
- [ ] `src/services/xr/` exists with `api.ts`, `queryKeys.ts`, `queries.ts`, `types.ts`
- [ ] `generateXRLoginCode()` returns `Promise<{ code: string }>` of 6 random digits after ~1200ms
- [ ] `getXRLoginCodeQueryOptions()` sets `staleTime: 0` and `gcTime: 0`
- [ ] Query keys follow hierarchical factory pattern (e.g. `XR_QUERY_KEYS.all`, `.loginCode()`)
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

None - can start immediately.
