## What to build

Give Home an entry point to the Create Patio screen. Add a "Create patio" trigger button
(`plus_24` icon + label, surface variant) as the first child of the library toolbar — before the
filters — so the toolbar row reads `[Create patio] [Filters] [Sort]`. Clicking it navigates to
`/create-patio`.

## Acceptance criteria

- [ ] A "Create patio" button appears as the first item in the library toolbar, before the filters.
- [ ] Button uses the `plus_24` icon and a "Create patio" label.
- [ ] Clicking it navigates to `/create-patio`.
- [ ] Existing filter and sort controls are unchanged in behavior and order after the trigger.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-route-surface-header-scaffold
