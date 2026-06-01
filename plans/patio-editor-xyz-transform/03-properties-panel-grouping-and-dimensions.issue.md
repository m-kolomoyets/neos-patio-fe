## What to build

The polished Properties panel: four grouped sections and a live, read-only model-dimensions readout.

End-to-end: with an object selected, the panel shows Position (X/Y/Z m), Rotation (X/Y/Z °), Model Dimensions (X/Y/Z m, read-only), and Scale. Dimensions reflect the model's real-world size and update live as scale changes, so a designer can size an object to a target footprint by eye.

Dimensions are derived, not stored: for the selected object the panel loads the model list and the model's GLTF (the same cached `useGLTF` instance the scene uses — no extra fetch), computes the local-space bounding-box size once, and multiplies by the object's scale. Local-space size keeps the readout rotation-independent. Computation happens outside the `Canvas`, which is valid because GLTF caching and `Box3` are renderer-agnostic.

## Acceptance criteria

- [ ] Panel renders four labeled groups in order: Position, Rotation, Model Dimensions, Scale.
- [ ] Position X/Y/Z editable, meters, step 0.1.
- [ ] Rotation X/Y/Z editable, degrees, step 1 (from slice 02).
- [ ] Scale editable, uniform, step 0.1.
- [ ] Model Dimensions X/Y/Z are read-only and show `localBboxSize × scale` in meters.
- [ ] Dimensions update live when scale changes; unaffected by rotation.
- [ ] GLTF is not double-fetched (reuses the cached `useGLTF` instance).
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-cartesian-model-and-3-axis-translate
