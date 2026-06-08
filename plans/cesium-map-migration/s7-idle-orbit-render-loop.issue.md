## What to build

Enable idle camera orbit on Cesium and finalize the demand-render loop so the scene animates when
expected and stays still (no GPU/battery churn) when idle.

End-to-end:
- Port `useIdleRotation` to a Cesium camera heading-orbit around the bounds-center target, driven by
  a RAF loop that calls `scene.requestRender()` per frame only while orbiting. **Enable it** (it was
  previously disabled).
- Idle orbit starts after the idle timeout and stops immediately on any pointer/wheel/touch/key
  interaction.
- Finalize `requestRenderMode`: audit that every mutation path (add/remove/transform/select, gizmo
  drag, camera writes, panel edits) fires `scene.requestRender()`, ideally centralized through
  `EditorContext` so there is one place to fire it. Confirm the scene does not render when fully idle
  and not orbiting.

## Acceptance criteria

- [ ] Idle orbit is enabled and begins after the idle timeout
- [ ] Any interaction (pointer/wheel/touch/key) immediately stops idle orbit
- [ ] Idle orbit and fly animations drive per-frame `requestRender()` while active
- [ ] When fully idle and not orbiting, the scene does not re-render (verified)
- [ ] No mutation path leaves a stale frame (render fired centrally)
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #plans/cesium-map-migration/s6-viewcube-camera-adapter.issue.md
