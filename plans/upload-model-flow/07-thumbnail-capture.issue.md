## What to build

Thumbnail capture from the preview scene. On entering `preview`, auto-capture a default snapshot;
provide a re-capture button to snapshot the current camera view. Captures go through
`canvas.toBlob()`, downscaled to a 256×256 square, stored as a `Blob` in provider state (with a
derived object URL for rendering). The sidebar pending item swaps from progress to the thumbnail.

## Acceptance criteria

- [ ] A default thumbnail is captured automatically once when the preview opens
- [ ] A re-capture button overwrites the thumbnail with the current camera view
- [ ] Capture produces a 256×256 `Blob`; an object URL is derived for display
- [ ] Sidebar pending item swaps from progress bar to the thumbnail once captured
- [ ] Object URLs are revoked when replaced/torn down (no leaks)
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #06-preview-scene
