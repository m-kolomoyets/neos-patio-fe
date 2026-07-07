## What to build

Extract Home's Action Bar into a shared component so both Home and Create Patio render the identical
bar. Move the `ActionsBar` folder (with its `PatioAutocomplete` sub-component, `useActionBarSearch`
hook, and constants) out of the Home module to a shared components location. Replace the
route-scoped `useHomeNavigate` with the router's plain `useNavigate()` so the bar is route-agnostic.
Home renders the shared bar with no behavior change; Create Patio renders the same `<ActionBar/>`
absolutely positioned over its surface, exactly like Home.

## Acceptance criteria

- [ ] Action Bar lives in a shared components location, not under the Home module.
- [ ] `useHomeNavigate` usage inside the bar is replaced with plain `useNavigate()`.
- [ ] Home renders the shared bar with identical appearance and behavior (patio search → `/patios/$id`,
      wallet connect, XR dialog).
- [ ] Create Patio renders the same `<ActionBar/>`, absolutely positioned over the surface like Home.
- [ ] No leftover imports pointing at the old Home `ActionsBar` path.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-route-surface-header-scaffold
