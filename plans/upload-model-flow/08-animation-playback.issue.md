## What to build

Animation playback in the preview. If the loaded glb has clips, show a Play control that plays the
first clip once and holds its final pose; while playing it becomes Pause. The control is hidden
entirely when the model has no animations.

## Acceptance criteria

- [ ] Clips read via drei `useAnimations`; control shown only when ≥1 clip exists
- [ ] Play plays the first clip with `LoopOnce` + `clampWhenFinished` (holds final pose)
- [ ] On finish, the control resets to Play (replayable)
- [ ] While playing, control shows Pause; Pause freezes and Play resumes from that point
- [ ] No control rendered for models with zero animations
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

- Blocked by #06-preview-scene
