# 01 — Data model: format + size

## What to build

Extend the asset data contract so every model carries a human-readable format label and a byte size, and add a helper that renders bytes as MB. This is the foundation the popup's bottom section reads from.

Touches the `Model3D` type, the mock models API (so listed models include the new fields), and a small `formatFileSize` utility colocated where the popup will use it.

## Acceptance criteria

- [ ] `Model3D` type includes `format: string` and `sizeBytes: number`.
- [ ] The mock models API returns plausible `format` (e.g. `glTF`) and `sizeBytes` for every model.
- [ ] `formatFileSize(bytes)` returns a rounded MB string (e.g. `120 MB`).
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

None - can start immediately.
