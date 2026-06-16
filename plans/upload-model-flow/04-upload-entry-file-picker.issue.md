## What to build

The entry point and first step of the flow: an **Upload Assets** trigger in the left sidebar's
Assets tab that opens the upload dialog on its `selecting` step. The step lets the user choose a
file by browsing or drag-and-drop, validates extension (`.glb` / `.gltf`) and size (≤250MB), and
shows validation errors inline. No upload happens yet — picking a valid file is the success exit.

## Acceptance criteria

- [ ] **Upload Assets** button rendered at the bottom of the Assets sidebar; opens the dialog (Base UI `Dialog`)
- [ ] `UploadModelFlow` sub-module created under `PatioEditor/components/`
- [ ] File can be selected via browse and via drag-and-drop
- [ ] Wrong extension rejected with inline error; only `.glb`/`.gltf` accepted
- [ ] Files >250MB rejected with inline error
- [ ] A valid selected file is captured and the flow is ready to advance
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

None - can start immediately
