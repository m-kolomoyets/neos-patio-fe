import type { Cartesian2, Primitive, Scene } from 'cesium';
import type { EditorMode } from '../../../types';
import type { GizmoAxis, GizmoHandleKind, GizmoTarget, TransformGizmoHandle } from './types';
import {
    Cartesian3,
    Cartesian4,
    Matrix3,
    Matrix4,
    PerspectiveFrustum,
    Quaternion,
    ScreenSpaceEventHandler,
    ScreenSpaceEventType,
    Transforms,
} from 'cesium';
import { closestPointOnAxis, rayPlaneIntersection, scaleRatio, signedAngleAboutAxis } from './dragMath';
import { createRotateHandles, createScaleHandles, createTranslateHandles } from './handles';
import { isGizmoPickId } from './types';

/** On-screen length (px) the gizmo's `1.0` local unit is rescaled to each frame. */
const GIZMO_PIXEL_SIZE = 90;

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
    moved: boolean;
};

type DragState = TranslateDrag | RotateDrag | ScaleDrag;

const createHandles = (mode: EditorMode): Primitive | null => {
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
    const { scene, target, mode, onDragMove, onDragEnd } = options;

    const requestRender = () => {
        if (!scene.isDestroyed()) scene.requestRender();
    };

    const primitive = createHandles(mode);
    if (primitive) scene.primitives.add(primitive);

    // Keep the gizmo pinned to the (possibly mid-drag) target origin, ENU-aligned,
    // and a constant on-screen size — recomputed every frame.
    const onPreRender = () => {
        if (!primitive) return;
        const origin = targetOrigin(target);
        const enu = Transforms.eastNorthUpToFixedFrame(origin);
        primitive.modelMatrix = Matrix4.multiplyByUniformScale(enu, screenScale(scene, origin), new Matrix4());
    };
    scene.preRender.addEventListener(onPreRender);

    let drag: DragState | null = null;

    const pickHandle = (position: Cartesian2): { axis: GizmoAxis; kind: GizmoHandleKind } | null => {
        const picked = scene.pick(position) as { id?: unknown } | undefined;
        const pickId = picked?.id;
        return isGizmoPickId(pickId) ? pickId.gizmoHandle : null;
    };

    const handler = new ScreenSpaceEventHandler(scene.canvas);

    handler.setInputAction((event: ScreenSpaceEventHandler.PositionedEvent) => {
        const handle = primitive ? pickHandle(event.position) : null;
        if (!handle) return;

        const { axis } = handle;
        const origin = targetOrigin(target);
        const axisDirection = worldAxisDirection(origin, axis);
        const ray = scene.camera.getPickRay(event.position);
        if (!ray) return;

        if (handle.kind === 'rotate') {
            const hit = rayPlaneIntersection(ray.origin, ray.direction, origin, axisDirection);
            if (!hit) return;
            drag = {
                kind: 'rotate',
                axis,
                axisDirection,
                lastSpoke: Cartesian3.subtract(hit, origin, new Cartesian3()),
                moved: false,
            };
        } else if (handle.kind === 'scale') {
            drag = {
                kind: 'scale',
                axis,
                axisDirection,
                startDistance: cursorAxisDistance(ray.origin, ray.direction, origin, axisDirection),
                startMatrix: Matrix4.clone(target.modelMatrix, new Matrix4()),
                moved: false,
            };
        } else {
            const closest = closestPointOnAxis(ray.origin, ray.direction, origin, axisDirection);
            drag = {
                kind: 'translate',
                axis,
                axisDirection,
                grabOffset: Cartesian3.subtract(origin, closest, new Cartesian3()),
                moved: false,
            };
        }
        // Stop the drag from orbiting/panning the camera.
        scene.screenSpaceCameraController.enableInputs = false;
    }, ScreenSpaceEventType.LEFT_DOWN);

    handler.setInputAction((event: ScreenSpaceEventHandler.MotionEvent) => {
        if (!drag) return;
        const origin = targetOrigin(target);
        const ray = scene.camera.getPickRay(event.endPosition);
        if (!ray) return;

        if (drag.kind === 'rotate') {
            const hit = rayPlaneIntersection(ray.origin, ray.direction, origin, drag.axisDirection);
            if (!hit) return;
            const spoke = Cartesian3.subtract(hit, origin, new Cartesian3());
            const delta = signedAngleAboutAxis(drag.lastSpoke, spoke, drag.axisDirection);
            rotateInPlace(target.modelMatrix, drag.axisDirection, delta);
            drag.lastSpoke = spoke;
        } else if (drag.kind === 'scale') {
            const distance = cursorAxisDistance(ray.origin, ray.direction, origin, drag.axisDirection);
            const ratio = scaleRatio(drag.startDistance, distance);
            // Rescale uniformly from the grab-time snapshot to avoid per-frame drift.
            Matrix4.multiplyByUniformScale(drag.startMatrix, ratio, target.modelMatrix);
        } else {
            const closest = closestPointOnAxis(ray.origin, ray.direction, origin, drag.axisDirection);
            const nextOrigin = Cartesian3.add(closest, drag.grabOffset, new Cartesian3());
            Matrix4.setTranslation(target.modelMatrix, nextOrigin, target.modelMatrix);
        }
        drag.moved = true;

        requestRender();
        onDragMove?.();
    }, ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(() => {
        if (!drag) return;
        const { axis, moved } = drag;
        drag = null;
        scene.screenSpaceCameraController.enableInputs = true;
        // A bare click (no movement) must not commit a no-op history entry.
        if (moved) onDragEnd?.(axis);
    }, ScreenSpaceEventType.LEFT_UP);

    return {
        destroy() {
            scene.preRender.removeEventListener(onPreRender);
            handler.destroy();
            if (primitive && !primitive.isDestroyed()) scene.primitives.remove(primitive);
            // Restore camera inputs if torn down mid-drag.
            scene.screenSpaceCameraController.enableInputs = true;
            requestRender();
        },
    };
};
