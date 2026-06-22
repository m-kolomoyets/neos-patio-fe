## What to build

Replace the temporary `finish()` trigger from slice 02 with the real one: the overlay holds until the Cesium map has framed the patio by its coordinates and its first LOD has settled. After the scene bootstrap adds the tileset and frames the camera to the patio bounds, attach a listener to the tileset's `initialTilesLoaded` event (fires once when all view-requested tiles finish their first load); that listener calls the context `finish()`.

The scene bootstrap gains an `onReady` callback parameter. The map canvas reads `finish` from the page-transition context and passes it as `onReady`. A 5-second safety timeout runs alongside — whichever fires first calls `finish()`, so the overlay can never get stuck. Teardown removes the tileset listener and clears the timeout.

`initialTilesLoaded` is used over polling `allTilesLoaded` on `postRender` — same intent, one listener, no per-frame poll.

## Acceptance criteria

- [ ] Overlay fade-out starts only after the place is framed and tiles' first LOD has settled (not on data-resolve)
- [ ] Scene bootstrap accepts an `onReady` callback; map canvas passes context `finish`
- [ ] If tiles never settle, the overlay clears after a 5s safety timeout
- [ ] Whichever of ready-signal / timeout fires first wins; the other is a no-op
- [ ] Teardown removes the tileset listener and clears the timeout (no leaks / no post-destroy mutation)

## Blocked by

- Blocked by #02-page-transition-context-overlay
