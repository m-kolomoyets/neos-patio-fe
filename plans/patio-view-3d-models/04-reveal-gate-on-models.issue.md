# Reveal gate on models

## What to build

Hold the Patio View reveal until placed models finish loading, so the scene is
complete on first paint. The view-only objects layer exposes an `onLoaded`
signal that settles when the batch completes — counting each model's success
**and** failure/timeout, so a dead asset URL can never stall the reveal. The
shared `CesiumMap` stops clearing the page-transition overlay itself in view
mode (it still flags scene-ready on tileset settle); Patio View clears the
overlay / reveals only when both map-ready and objects-loaded are true. A patio
with no objects reveals on map-ready as today. A safety timeout guarantees the
reveal fires even if the objects-loaded signal never arrives. The editor route's
reveal behavior is unchanged.

## Acceptance criteria

- [ ] Objects layer fires `onLoaded` once the batch settles (or immediately when no objects)
- [ ] A model load error counts as settled (does not stall the gate)
- [ ] A never-resolving load is bounded by a timeout that still fires the reveal
- [ ] Reveal / overlay clear happens only when map-ready AND objects-loaded
- [ ] Empty-objects patios reveal on map-ready, same as before
- [ ] Editor route reveal behavior is unchanged
- [ ] `CesiumMap` no longer owns the overlay clear in view mode

## Blocked by

- Blocked by #02-multi-model-batch-catalog
