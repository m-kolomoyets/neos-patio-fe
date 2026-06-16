## What to build

The 3D preview step: a standalone R3F `<Canvas>` (with `preserveDrawingBuffer` for later
snapshotting) that renders the parsed model, framed and lit locally, and lets the user rotate it
with OrbitControls. Shown only on the `preview` state (i.e. after upload success).

## Acceptance criteria

- [ ] `ModelPreviewScene` renders the uploaded model in a standalone `<Canvas gl={{ preserveDrawingBuffer: true }}>`
- [ ] OrbitControls allow rotate/zoom of the model
- [ ] Model auto-framed/centered and lit via drei `<Stage>` / local lights (no remote `<Environment>` HDR)
- [ ] Scene only mounts in the `preview` state
- [ ] Separate from the existing `MapCanvas` R3F usage (no interference)
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #05-provider-uploading-sidebar-item
