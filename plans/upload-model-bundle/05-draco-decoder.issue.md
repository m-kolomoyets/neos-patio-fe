## What to build

Attach a `DRACOLoader` to the preview `GLTFLoader` so models using `KHR_draco_mesh_compression` parse and preview successfully. The Draco decoder is lazy-loaded. Applies to all input kinds (`.glb`, `.gltf` folder, `.zip`) since they share the preview loader.

KTX2 (`KHR_texture_basisu`) and Meshopt remain out of scope (follow-up).

## Acceptance criteria

- [ ] A Draco-compressed `.glb` previews correctly.
- [ ] A Draco-compressed `.gltf` bundle previews correctly.
- [ ] The Draco decoder assets are lazy-loaded (not in the main chunk).
- [ ] Non-Draco models are unaffected.
- [ ] `tsc` and lint pass.

## Blocked by

- Blocked by #01-model-bundle-foundation
