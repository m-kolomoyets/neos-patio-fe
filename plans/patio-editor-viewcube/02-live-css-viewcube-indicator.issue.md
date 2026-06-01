## What to build

A live, read-only ViewCube indicator inside the widget shell. A CSS 3D-transform cube (a container with 6 face `<div>`s, no three.js) whose perspective mirrors the live map camera, so it acts as a combined compass-and-pitch indicator.

The cube transform mirrors the camera as `rotateX(pitch) rotateZ(-bearing)` (signs tuned so the N face sits correctly at bearing 0). Side faces are labeled **N / E / S / W**, the top face **T**; the bottom is never seen. Letters are painted on the faces (rotate with the face), matching Figma's flat-shaded look. Faces/corners carry `data-face` attributes and show a CSS hover highlight (no interactivity yet — clicks/drag come in #3).

## Acceptance criteria

- [ ] A CSS-3D cube renders in the widget; flat-shaded, matching the Figma look.
- [ ] Side faces labeled N/E/S/W, top labeled T, letters painted on faces.
- [ ] Cube perspective tracks live map bearing and pitch (`rotateX(pitch) rotateZ(-bearing)`); orbiting/tilting the map updates the cube in real time.
- [ ] The N face is oriented correctly at bearing 0 (sign of `rotateZ` verified).
- [ ] Faces and corners have `data-face` attributes and a CSS `:hover` highlight.
- [ ] No three.js / GL is used for the cube.
- [ ] `npm run tsc` and `npm run lint` pass.

## Blocked by

- Blocked by #01-camera-plumbing-and-replace-navigation-control
