## What to build

Give every placed object a stable, human-readable name. Add a persisted `name` field to
the `PlacedObject` model and generate it when an object is added: the first instance of a
model keeps the bare model name, and each subsequent instance of the same model gets a
space-separated numeric suffix (`Anvil`, `Anvil 2`, `Anvil 3`). The counter is monotonic —
one past the highest existing suffix among objects sharing the same `modelId` — so deleting
an earlier instance never causes a collision or reshuffle. Name generation is a pure helper
(model display name + current objects in, unique name out) called from the `add` reducer
path.

This slice has no visible UI of its own; it is verifiable by adding objects and inspecting
that each carries a correct, unique `name`.

## Acceptance criteria

- [ ] `PlacedObject` has a required `name: string` field.
- [ ] Adding the first instance of a model sets `name` to the bare model display name.
- [ ] Adding further instances of the same model yields ` 2`, ` 3`, … suffixes.
- [ ] Counter is max-existing-suffix + 1, so deleting an earlier instance does not change other names or cause a collision on the next add.
- [ ] Name generation is a standalone pure helper, not inlined logic in the reducer.
- [ ] Type-check and lint pass.

## Blocked by

None - can start immediately.
