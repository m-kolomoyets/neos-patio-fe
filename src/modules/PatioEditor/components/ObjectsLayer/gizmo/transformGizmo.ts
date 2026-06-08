import type { Cartesian2, PointPrimitiveCollection, Primitive, Scene } from 'cesium';
import type { EditorMode } from '../../../types';
import type { GizmoHandles } from './handles';
import type { GizmoAxis, GizmoHandleKind, GizmoTarget, TransformGizmoHandle } from './types';
import {
    Cartesian3,
    Cartesian4,
    Math as CesiumMath,
    KeyboardEventModifier,
    Matrix3,
    Matrix4,
    PerspectiveFrustum,
    Quaternion,
    ScreenSpaceEventHandler,
    ScreenSpaceEventType,
    Transforms,
} from 'cesium';
import {
    closestPointOnAxis,
    radiansToDisplayDegrees,
    rayPlaneIntersection,
    scaleRatio,
    signedAngleAboutAxis,
    snapAngle,
} from './dragMath';
import {
    axisRotation,
    buildMoveArrowHeadPrimitive,
    buildMoveDotCollection,
    buildMoveLinePrimitive,
    buildRingStrokePrimitive,
    buildScaleCubePrimitive,
    buildScaleDragLinePrimitive,
    buildScaleLinesPrimitive,
    buildSectorPrimitive,
    buildSectorStrokePrimitive,
    buildTranslateLinesPrimitive,
    createRotateHandles,
    createScaleHandles,
    createTranslateHandles,
    hasMoveLine,
    hideHandles,
    moveArrowHeadMatrix,
    moveOverlayColor,
    scaleCubeMatrix,
    scaleCubeOffset,
    scaleLineColors,
    scaleOverlayColor,
    setDraggedAxis,
    setHoveredAxis,
    translateLineColors,
} from './handles';
import { isGizmoPickId } from './types';

/** On-screen length (px) the gizmo's `1.0` local unit is rescaled to each frame. */
const GIZMO_PIXEL_SIZE = 90;

/** Rotate-drag snap increment (degrees) applied while shift is held. */
const ROTATE_SNAP_DEGREES = 15;
const ROTATE_SNAP_RADIANS = CesiumMath.toRadians(ROTATE_SNAP_DEGREES);

/** Column index into an ENU frame for each world axis (east/north/up). */
const AXIS_COLUMN: Record<GizmoAxis, number> = { x: 0, y: 1, z: 2 };

type TransformGizmoOptions = {
    scene: Scene;
    /** The live target whose `modelMatrix` the drag mutates (a loaded Cesium `Model`). */
    target: GizmoTarget;
    mode: EditorMode;
    /** Fired each drag step so the caller can request a render under `requestRenderMode`. */
    onDragMove?: () => void;
    /** Fired once on release with the dragged axis, so the caller can commit one history entry. */
    onDragEnd?: (_axis: GizmoAxis) => void;
    /** Fired on grab (rotate + translate, not scale) so the caller can show the live readout. */
    onReadoutStart?: () => void;
    /** Fired each move with the mode's readout value (rotate: signed cumulative degrees; translate: abs metres). */
    onReadoutUpdate?: (_value: number) => void;
    /** Fired on release so the caller can clear the readout. */
    onReadoutEnd?: () => void;
};

/** World-space translation (origin) of a target's current `modelMatrix`. */
const targetOrigin = (target: GizmoTarget): Cartesian3 => {
    return Matrix4.getTranslation(target.modelMatrix, new Cartesian3());
};

/** Unit world direction of an ENU axis at `origin` (independent of object heading). */
const worldAxisDirection = (origin: Cartesian3, axis: GizmoAxis): Cartesian3 => {
    const enu = Transforms.eastNorthUpToFixedFrame(origin);
    const column = Matrix4.getColumn(enu, AXIS_COLUMN[axis], new Cartesian4());
    return Cartesian3.normalize(new Cartesian3(column.x, column.y, column.z), new Cartesian3());
};

/**
 * Angle (radians) of a world-space ring-plane vector within the ring's *local* XY
 * frame, undoing the ENU frame and the per-axis rotation that orient the ring. This
 * is the local start edge the swept sector is built from, so the fan lines up with
 * where the cursor grabbed the ring (origin is fixed for a rotate, so it is
 * computed once at grab).
 */
const ringPlaneAngle = (origin: Cartesian3, axis: GizmoAxis, spokeWorld: Cartesian3): number => {
    const enuRotation = Matrix4.getMatrix3(Transforms.eastNorthUpToFixedFrame(origin), new Matrix3());
    const ringRotation = Matrix3.multiply(enuRotation, axisRotation(axis), new Matrix3());
    const local = Matrix3.multiplyByVector(
        Matrix3.transpose(ringRotation, new Matrix3()),
        spokeWorld,
        new Cartesian3()
    );
    return Math.atan2(local.y, local.x);
};

/**
 * Rotate `matrix` by `angle` about the world `axisDirection` through the object's
 * own origin: only the upper-left 3×3 (orientation × scale) turns, the translation
 * is preserved, so the object spins in place about a world ENU axis.
 */
const rotateInPlace = (matrix: Matrix4, axisDirection: Cartesian3, angle: number): void => {
    const quaternion = Quaternion.fromAxisAngle(axisDirection, angle, new Quaternion());
    const rotation = Matrix3.fromQuaternion(quaternion, new Matrix3());
    const rotation4 = Matrix4.fromRotationTranslation(rotation, Cartesian3.ZERO, new Matrix4());

    const translation = Matrix4.getTranslation(matrix, new Cartesian3());
    Matrix4.setTranslation(matrix, Cartesian3.ZERO, matrix);
    Matrix4.multiply(rotation4, matrix, matrix);
    Matrix4.setTranslation(matrix, translation, matrix);
};

/**
 * Uniform scale that keeps `1.0` local unit ≈ {@link GIZMO_PIXEL_SIZE} pixels at
 * the gizmo's current distance, so handles stay a constant on-screen size at any
 * zoom. Derived from the perspective vertical FOV and viewport height.
 */
const screenScale = (scene: Scene, origin: Cartesian3): number => {
    const { camera, canvas } = scene;
    const distance = Cartesian3.distance(camera.positionWC, origin);
    const { frustum } = camera;
    const fovy = (frustum instanceof PerspectiveFrustum ? frustum.fovy : undefined) ?? Math.PI / 3;
    const height = canvas.clientHeight || 1;
    const metersPerPixel = (2 * distance * Math.tan(fovy / 2)) / height;
    return GIZMO_PIXEL_SIZE * metersPerPixel;
};

/** A translate drag: slide the origin along a world axis line under the cursor. */
type TranslateDrag = {
    kind: 'translate';
    axis: GizmoAxis;
    axisDirection: Cartesian3;
    /** origin − closestPoint at grab time, so the handle doesn't jump under the cursor. */
    grabOffset: Cartesian3;
    /** Grab-time origin (the "zero point"): the gizmo freezes here, the growing arrow and dot anchor to it. */
    frozenOrigin: Cartesian3;
    /** Whether the pointer actually moved, so a bare click commits no history entry. */
    moved: boolean;
};

/** A rotate drag: turn the model about a world axis by the swept ring angle. */
type RotateDrag = {
    kind: 'rotate';
    axis: GizmoAxis;
    axisDirection: Cartesian3;
    /** origin → previous ring-plane hit, so each move applies an incremental delta. */
    lastSpoke: Cartesian3;
    /** Signed cumulative angle (radians) the cursor has swept, summed from per-move deltas. */
    rawTotalAngle: number;
    /**
     * Angle (radians) actually applied to the model so far. Equals `rawTotalAngle`
     * when free, or the nearest snap multiple while shift is held; each move applies
     * the difference so snap/unsnap toggles live mid-drag.
     */
    appliedAngle: number;
    /** Grab spoke's angle in the ring's local XY frame — the swept sector's start edge. */
    startAngle: number;
    moved: boolean;
};

/** A scale drag: scale the model uniformly by the cursor's distance ratio. */
type ScaleDrag = {
    kind: 'scale';
    axis: GizmoAxis;
    axisDirection: Cartesian3;
    /** Cursor's distance from the origin along the axis at grab time (the ratio denominator). */
    startDistance: number;
    /** Model matrix snapshot at grab time, rescaled from each frame to avoid drift. */
    startMatrix: Matrix4;
    /** Live current/start distance ratio, driving both the model scale and the cube's follow offset. */
    ratio: number;
    moved: boolean;
};

type DragState = TranslateDrag | RotateDrag | ScaleDrag;

const createHandles = (mode: EditorMode): GizmoHandles | null => {
    if (mode === 'translate') return createTranslateHandles();
    if (mode === 'rotate') return createRotateHandles();
    if (mode === 'scale') return createScaleHandles();
    return null;
};

/** Cursor's distance from the origin along a world axis: project the ray, then measure. */
const cursorAxisDistance = (
    rayOrigin: Cartesian3,
    rayDirection: Cartesian3,
    origin: Cartesian3,
    axisDirection: Cartesian3
): number => {
    const closest = closestPointOnAxis(rayOrigin, rayDirection, origin, axisDirection);
    return Cartesian3.distance(closest, origin);
};

/**
 * Framework-agnostic transform gizmo. It builds an always-on-top handle primitive
 * from real mesh geometry for the active mode — arrows for translate, rings for
 * rotate, cubes for scale — oriented in the world ENU frame at the target's origin
 * and rescaled every frame to a constant on-screen size. A translate drag resolves
 * the new position as the closest point between the mouse ray and the world axis
 * line; a rotate drag turns the model about the grabbed world axis by the ring
 * angle the cursor sweeps; a scale drag scales the model uniformly by the ratio of
 * the cursor's current to start distance from the origin. All mutate the target's
 * `modelMatrix` live and pause camera inputs for the drag.
 */
export const createTransformGizmo = (options: TransformGizmoOptions): TransformGizmoHandle => {
    const { scene, target, mode, onDragMove, onDragEnd, onReadoutStart, onReadoutUpdate, onReadoutEnd } = options;

    const requestRender = () => {
        if (!scene.isDestroyed()) scene.requestRender();
    };

    const handles = createHandles(mode);
    if (handles) scene.primitives.add(handles.primitive);

    // The rotate-drag overlay, alive only during a rotate drag: the swept-angle
    // sector fill, its yellow boundary stroke, and the thin white stroke over the
    // active ring. The fill + stroke are rebuilt as the angle changes (each update
    // removes the prior pair); the white ring is built once on grab.
    let sector: Primitive | null = null;
    let sectorStroke: Primitive | null = null;
    let ring: Primitive | null = null;

    // The axis lines: thin 3px screen-space polylines from the origin out along
    // each axis (a separate primitive, since polylines can't share the handles'
    // mesh appearance). Used by translate (shaft lines, RGB) and scale (origin→cube
    // lines, grey/yellow); persists at rest and is rebuilt on hover/drag transitions
    // to recolor / hide the non-active axes. Null in rotate mode.
    let lines: Primitive | null = null;

    // The move-drag overlay, alive only during a translate drag: a world-space
    // growing arrow (shaft line + cone head) from the frozen zero point to the
    // object's live origin, plus a dot at the zero point. The line is rebuilt each
    // frame as the object moves; the head's matrix is re-placed each frame; the dot
    // is fixed at the zero point. All null outside a translate drag.
    let moveLine: Primitive | null = null;
    let moveHead: Primitive | null = null;
    let moveDots: PointPrimitiveCollection | null = null;

    // The scale-drag overlay, alive only during a scale drag: the dragged cube and
    // its stretching axis line, both yellow, following the cursor along the axis at
    // offset `baseOffset · ratio`. The static handle cubes are hidden for the drag;
    // the line is rebuilt each frame as the offset changes, the cube re-placed each
    // frame. Both null outside a scale drag.
    let scaleCube: Primitive | null = null;
    let scaleLine: Primitive | null = null;

    const removePrimitive = (primitive: Primitive | null): null => {
        if (primitive && !primitive.isDestroyed() && scene.primitives.contains(primitive)) {
            scene.primitives.remove(primitive);
        }
        return null;
    };

    const removeMoveOverlay = () => {
        moveLine = removePrimitive(moveLine);
        moveHead = removePrimitive(moveHead);
        if (moveDots && !moveDots.isDestroyed() && scene.primitives.contains(moveDots)) {
            scene.primitives.remove(moveDots);
        }
        moveDots = null;
    };

    // Rebuild the growing shaft line (skipped while degenerate) and re-place the cone
    // head for the current frozen→live span. Called each frame during a translate drag.
    const updateMoveOverlay = (translate: TranslateDrag) => {
        const zero = translate.frozenOrigin;
        const live = targetOrigin(target);
        const color = moveOverlayColor(translate.axis);
        moveLine = removePrimitive(moveLine);
        if (hasMoveLine(zero, live)) {
            moveLine = buildMoveLinePrimitive(zero, live, color);
            scene.primitives.add(moveLine);
        }
        if (moveHead) {
            moveHead.modelMatrix = moveArrowHeadMatrix(zero, live, translate.axisDirection, screenScale(scene, live));
        }
    };

    const removeScaleOverlay = () => {
        scaleCube = removePrimitive(scaleCube);
        scaleLine = removePrimitive(scaleLine);
    };

    // Rebuild the stretching axis line and re-place the dragged cube for the drag's
    // current ratio, sharing the gizmo's per-frame `frame`. Called each frame during
    // a scale drag, so the line + cube track the cursor along the axis.
    const updateScaleOverlay = (scaleDrag: ScaleDrag, frame: Matrix4) => {
        const offset = scaleCubeOffset(scaleDrag.ratio);
        const color = scaleOverlayColor();
        scaleLine = removePrimitive(scaleLine);
        scaleLine = buildScaleDragLinePrimitive(scaleDrag.axis, color, offset);
        scaleLine.modelMatrix = Matrix4.clone(frame, new Matrix4());
        scene.primitives.add(scaleLine);
        if (scaleCube) scaleCube.modelMatrix = scaleCubeMatrix(frame, scaleDrag.axis, offset);
    };

    // Rebuild the axis lines for the current hover/drag state, sharing the handles'
    // per-frame frame. Translate uses RGB shaft lines, scale grey/yellow origin→cube
    // lines; no-op in rotate mode.
    const rebuildLines = (hovered: GizmoAxis | null, dragged: GizmoAxis | null) => {
        lines = removePrimitive(lines);
        if (!handles) return;
        if (mode === 'translate') {
            lines = buildTranslateLinesPrimitive(translateLineColors(hovered, dragged));
        } else if (mode === 'scale') {
            lines = buildScaleLinesPrimitive(scaleLineColors(hovered, dragged));
        } else {
            return;
        }
        lines.modelMatrix = Matrix4.clone(handles.primitive.modelMatrix, new Matrix4());
        scene.primitives.add(lines);
    };
    // Resting axis lines, drawn from the start in translate and scale modes.
    rebuildLines(null, null);

    const removeSector = () => {
        sector = removePrimitive(sector);
        sectorStroke = removePrimitive(sectorStroke);
    };

    const removeOverlay = () => {
        removeSector();
        ring = removePrimitive(ring);
    };

    // Rebuild the sector fill + yellow stroke for the current swept span, sharing
    // the rings' outer frame.
    const updateSector = (axis: GizmoAxis, startAngle: number, endAngle: number) => {
        removeSector();
        const frame = handles ? Matrix4.clone(handles.primitive.modelMatrix, new Matrix4()) : undefined;
        sector = buildSectorPrimitive(axis, startAngle, endAngle);
        sectorStroke = buildSectorStrokePrimitive(axis, startAngle, endAngle);
        if (frame) {
            sector.modelMatrix = frame;
            sectorStroke.modelMatrix = Matrix4.clone(frame, new Matrix4());
        }
        scene.primitives.add(sector);
        scene.primitives.add(sectorStroke);
    };

    // Build the thin white stroke over the active ring, once on grab.
    const addRingStroke = (axis: GizmoAxis) => {
        ring = buildRingStrokePrimitive(axis);
        if (handles) ring.modelMatrix = Matrix4.clone(handles.primitive.modelMatrix, new Matrix4());
        scene.primitives.add(ring);
    };

    // Keep the gizmo pinned to the (possibly mid-drag) target origin, ENU-aligned,
    // and a constant on-screen size — recomputed every frame. The sector shares the
    // same frame so it stays in the active ring's plane.
    // The gizmo's per-frame frame: the ENU rotation at `origin`, uniformly scaled so
    // `1.0` local unit is a constant on-screen pixel length at the current zoom.
    const gizmoFrame = (origin: Cartesian3): Matrix4 => {
        const enu = Transforms.eastNorthUpToFixedFrame(origin);
        return Matrix4.multiplyByUniformScale(enu, screenScale(scene, origin), new Matrix4());
    };

    const onPreRender = () => {
        if (!handles) return;
        // A translate drag freezes the gizmo at the grab-start zero point; every
        // other mode (and resting) re-pins to the live target origin each frame.
        const origin = drag?.kind === 'translate' ? drag.frozenOrigin : targetOrigin(target);
        const scaled = gizmoFrame(origin);
        handles.primitive.modelMatrix = scaled;
        if (sector) sector.modelMatrix = scaled;
        if (sectorStroke) sectorStroke.modelMatrix = Matrix4.clone(scaled, new Matrix4());
        if (ring) ring.modelMatrix = Matrix4.clone(scaled, new Matrix4());
        if (lines) lines.modelMatrix = Matrix4.clone(scaled, new Matrix4());
        // Grow the move arrow toward the object's live (still-moving) origin.
        if (drag?.kind === 'translate') updateMoveOverlay(drag);
        // Stretch the scale line + slide the dragged cube to the live ratio.
        if (drag?.kind === 'scale') updateScaleOverlay(drag, scaled);
    };
    scene.preRender.addEventListener(onPreRender);

    let drag: DragState | null = null;
    // Axis under the cursor outside a drag, so hover highlight only changes on transitions.
    let hoveredAxis: GizmoAxis | null = null;

    const pickHandle = (position: Cartesian2): { axis: GizmoAxis; kind: GizmoHandleKind } | null => {
        const picked = scene.pick(position) as { id?: unknown } | undefined;
        const pickId = picked?.id;
        return isGizmoPickId(pickId) ? pickId.gizmoHandle : null;
    };

    const handler = new ScreenSpaceEventHandler(scene.canvas);

    // Rotate mode reads shift to snap the drag to whole 15° steps. Cesium's move
    // event carries no modifier flags, so track the key globally; a window blur
    // (alt-tab) resets it so the snap never sticks on after a missed keyup.
    let shiftHeld = false;
    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Shift') shiftHeld = true;
    };
    const onKeyUp = (event: KeyboardEvent) => {
        if (event.key === 'Shift') shiftHeld = false;
    };
    const onBlur = () => {
        shiftHeld = false;
    };
    if (mode === 'rotate') {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onBlur);
    }

    const onLeftDown = (event: ScreenSpaceEventHandler.PositionedEvent) => {
        const handle = handles ? pickHandle(event.position) : null;
        if (!handle) return;

        const { axis } = handle;
        const origin = targetOrigin(target);
        const axisDirection = worldAxisDirection(origin, axis);
        const ray = scene.camera.getPickRay(event.position);
        if (!ray) return;

        if (handle.kind === 'rotate') {
            const hit = rayPlaneIntersection(ray.origin, ray.direction, origin, axisDirection);
            if (!hit) return;
            const spoke = Cartesian3.subtract(hit, origin, new Cartesian3());
            const startAngle = ringPlaneAngle(origin, axis, spoke);
            drag = {
                kind: 'rotate',
                axis,
                axisDirection,
                lastSpoke: spoke,
                rawTotalAngle: 0,
                appliedAngle: 0,
                startAngle,
                moved: false,
            };
            addRingStroke(axis);
            updateSector(axis, startAngle, startAngle);
            onReadoutStart?.();
            onReadoutUpdate?.(0);
        } else if (handle.kind === 'scale') {
            drag = {
                kind: 'scale',
                axis,
                axisDirection,
                startDistance: cursorAxisDistance(ray.origin, ray.direction, origin, axisDirection),
                startMatrix: Matrix4.clone(target.modelMatrix, new Matrix4()),
                ratio: 1,
                moved: false,
            };
        } else {
            const closest = closestPointOnAxis(ray.origin, ray.direction, origin, axisDirection);
            drag = {
                kind: 'translate',
                axis,
                axisDirection,
                grabOffset: Cartesian3.subtract(origin, closest, new Cartesian3()),
                frozenOrigin: Cartesian3.clone(origin, new Cartesian3()),
                moved: false,
            };
        }
        // Clear any hover highlight, then reflect the grab: every mode hides the
        // static handles and draws a drag-only overlay — rotate the white ring stroke
        // + sector, translate the growing-arrow overlay, scale the following cube +
        // stretching line.
        hoveredAxis = null;
        if (handles) hideHandles(handles);
        // A scale grab replaces the resting cubes + lines with the dragged cube and
        // its stretching line, both yellow, following the cursor; torn down on release.
        if (handle.kind === 'scale' && drag.kind === 'scale') {
            lines = removePrimitive(lines);
            scaleCube = buildScaleCubePrimitive(scaleOverlayColor());
            scene.primitives.add(scaleCube);
            updateScaleOverlay(drag, gizmoFrame(origin));
        }
        // A translate grab replaces the resting shaft lines with the growing-arrow
        // overlay (line + cone head + zero-point dot), all torn down on release.
        if (handle.kind === 'translate' && drag.kind === 'translate') {
            lines = removePrimitive(lines);
            const color = moveOverlayColor(axis);
            moveHead = buildMoveArrowHeadPrimitive(color);
            scene.primitives.add(moveHead);
            moveDots = buildMoveDotCollection(drag.frozenOrigin, color);
            scene.primitives.add(moveDots);
            updateMoveOverlay(drag);
            onReadoutStart?.();
            onReadoutUpdate?.(0);
        }
        // Stop the drag from orbiting/panning the camera.
        scene.screenSpaceCameraController.enableInputs = false;
        requestRender();
    };

    const onMouseMove = (event: ScreenSpaceEventHandler.MotionEvent) => {
        // Outside a drag, lighten whichever axis the cursor is over (any mode).
        if (!drag) {
            if (!handles) return;
            const axis = pickHandle(event.endPosition)?.axis ?? null;
            if (axis !== hoveredAxis) {
                hoveredAxis = axis;
                setHoveredAxis(handles, axis);
                rebuildLines(axis, null);
                requestRender();
            }
            return;
        }
        const origin = targetOrigin(target);
        const ray = scene.camera.getPickRay(event.endPosition);
        if (!ray) return;

        if (drag.kind === 'rotate') {
            const hit = rayPlaneIntersection(ray.origin, ray.direction, origin, drag.axisDirection);
            if (!hit) return;
            const spoke = Cartesian3.subtract(hit, origin, new Cartesian3());
            const delta = signedAngleAboutAxis(drag.lastSpoke, spoke, drag.axisDirection);
            drag.lastSpoke = spoke;
            drag.rawTotalAngle += delta;
            // While shift is held, snap the applied orientation to whole 15° steps;
            // otherwise track the cursor exactly. Apply only the difference from what
            // is already on the matrix, so snap/unsnap toggles live mid-drag.
            const targetAngle = shiftHeld ? snapAngle(drag.rawTotalAngle, ROTATE_SNAP_RADIANS) : drag.rawTotalAngle;
            rotateInPlace(target.modelMatrix, drag.axisDirection, targetAngle - drag.appliedAngle);
            drag.appliedAngle = targetAngle;
            // Wrap the swept sector into (-360°, 360°) so a full turn resets the
            // fan instead of overlapping itself — matching the wrapped readout.
            const wrappedAngle = drag.appliedAngle % (2 * Math.PI);
            updateSector(drag.axis, drag.startAngle, drag.startAngle + wrappedAngle);
            // Negate so the readout follows screen direction: clockwise positive,
            // counter-clockwise negative (raw axis-signed angle is the opposite).
            onReadoutUpdate?.(radiansToDisplayDegrees(-drag.appliedAngle));
        } else if (drag.kind === 'scale') {
            const distance = cursorAxisDistance(ray.origin, ray.direction, origin, drag.axisDirection);
            const ratio = scaleRatio(drag.startDistance, distance);
            // Rescale uniformly from the grab-time snapshot to avoid per-frame drift.
            Matrix4.multiplyByUniformScale(drag.startMatrix, ratio, target.modelMatrix);
            // The cube + line follow the same ratio (placed in onPreRender this requests).
            drag.ratio = ratio;
        } else {
            const closest = closestPointOnAxis(ray.origin, ray.direction, origin, drag.axisDirection);
            const nextOrigin = Cartesian3.add(closest, drag.grabOffset, new Cartesian3());
            Matrix4.setTranslation(target.modelMatrix, nextOrigin, target.modelMatrix);
            // Absolute distance travelled from the frozen zero point; the overlay
            // itself regrows in onPreRender on the render this move requests.
            onReadoutUpdate?.(Cartesian3.distance(drag.frozenOrigin, nextOrigin));
        }
        drag.moved = true;

        requestRender();
        onDragMove?.();
    };

    const onLeftUp = () => {
        if (!drag) return;
        const { kind, axis, moved } = drag;
        drag = null;
        scene.screenSpaceCameraController.enableInputs = true;
        // Restore every axis to its base color and visibility, and clear the overlay.
        // Hover re-applies on the next move (hoveredAxis reset so it re-evaluates).
        if (handles) setDraggedAxis(handles, null);
        hoveredAxis = null;
        removeOverlay();
        removeMoveOverlay();
        removeScaleOverlay();
        // Restore the resting shaft lines (all axes, base color).
        rebuildLines(null, null);
        requestRender();
        // Clear the live readout even on a bare click, since the grab fired
        // onReadoutStart (rotate and translate fire it; scale does not).
        if (kind !== 'scale') onReadoutEnd?.();
        // A bare click (no movement) must not commit a no-op history entry.
        if (moved) onDragEnd?.(axis);
    };

    // Register each action for both no-modifier and the SHIFT modifier. Cesium's
    // ScreenSpaceEventHandler dispatches by modifier, so an action registered
    // without one stops firing while shift is held — which would freeze the
    // rotate drag exactly when snap-to-15° is wanted.
    handler.setInputAction(onLeftDown, ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(onLeftDown, ScreenSpaceEventType.LEFT_DOWN, KeyboardEventModifier.SHIFT);
    handler.setInputAction(onMouseMove, ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(onMouseMove, ScreenSpaceEventType.MOUSE_MOVE, KeyboardEventModifier.SHIFT);
    handler.setInputAction(onLeftUp, ScreenSpaceEventType.LEFT_UP);
    handler.setInputAction(onLeftUp, ScreenSpaceEventType.LEFT_UP, KeyboardEventModifier.SHIFT);

    return {
        destroy() {
            scene.preRender.removeEventListener(onPreRender);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', onBlur);
            handler.destroy();
            removeOverlay();
            removeMoveOverlay();
            removeScaleOverlay();
            lines = removePrimitive(lines);
            if (handles && !handles.primitive.isDestroyed()) scene.primitives.remove(handles.primitive);
            // Restore camera inputs if torn down mid-drag.
            scene.screenSpaceCameraController.enableInputs = true;
            requestRender();
        },
    };
};
