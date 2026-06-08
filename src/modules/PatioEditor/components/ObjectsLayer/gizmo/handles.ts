import type { Geometry } from 'cesium';
import type { GizmoAxis, GizmoHandleKind, GizmoPickId } from './types';
import {
    ArcType,
    BoxGeometry,
    Cartesian3,
    Math as CesiumMath,
    Color,
    ColorGeometryInstanceAttribute,
    CylinderGeometry,
    GeometryInstance,
    Matrix3,
    Matrix4,
    PerInstanceColorAppearance,
    PolylineColorAppearance,
    PolylineGeometry,
    Primitive,
    ShowGeometryInstanceAttribute,
} from 'cesium';
import { buildSectorGeometry } from './sectorGeometry';
import { buildTorusGeometry } from './torusGeometry';
import { GIZMO_HANDLE_ID } from './types';

/**
 * Handle geometry, in local ENU units where `1.0` is rescaled to a fixed
 * on-screen pixel length each frame (see `transformGizmo`). Arrows run from the
 * origin out along each axis: a thin shaft capped by a cone arrowhead.
 */
const SHAFT_LENGTH = 1;
const SHAFT_RADIUS = 0.025;
const HEAD_LENGTH = 0.3;
const HEAD_RADIUS = 0.09;
const SLICES = 24;

/** Rotation ring dimensions, in the same local ENU units as the arrows. */
const RING_RADIUS = 0.9;
const RING_TUBE_RADIUS = 0.04;
const RING_SEGMENTS = 64;
const RING_TUBE_SEGMENTS = 12;

/** Translucent yellow fill of the swept-angle sector drawn inside the active ring. */
const SECTOR_COLOR = Color.YELLOW.withAlpha(0.35);

/** Thin white outline drawn over the active ring while a rotate drag is live. */
const RING_STROKE_COLOR = Color.WHITE;
const RING_STROKE_WIDTH = 1.5;

/** Solid yellow stroke tracing the swept-angle sector's boundary during a rotate drag. */
const SECTOR_STROKE_COLOR = Color.YELLOW;
const SECTOR_STROKE_WIDTH = 2;

/** Cap on the sector-stroke arc subdivision, matching the sector fill's invariant. */
const MAX_STROKE_ARC_SEGMENTS = 8192;

/**
 * Lift a polyline's apex off the exact local origin, for the same reason the sector
 * fill does (see `sectorGeometry`): a vertex at `(0,0,0)` projects to the Earth's
 * centre during Cesium's 2D morph pass and throws.
 */
const STROKE_APEX_EPSILON = 1e-6;

/** Scale-cube dimensions: a cube sat at each axis end, in the same local units. */
const CUBE_SIZE = 0.18;
const CUBE_OFFSET = 1;

const AXES: readonly GizmoAxis[] = ['x', 'y', 'z'];

const AXIS_COLOR: Record<GizmoAxis, Color> = {
    x: Color.fromCssColorString('#ff3b53'),
    y: Color.fromCssColorString('#39d353'),
    z: Color.fromCssColorString('#3b82ff'),
};

/** How far the dragged axis is lightened toward white while a drag is active. */
const DRAG_HIGHLIGHT_AMOUNT = 0.45;

const AXIS_HIGHLIGHT_COLOR: Record<GizmoAxis, Color> = {
    x: Color.lerp(AXIS_COLOR.x, Color.WHITE, DRAG_HIGHLIGHT_AMOUNT, new Color()),
    y: Color.lerp(AXIS_COLOR.y, Color.WHITE, DRAG_HIGHLIGHT_AMOUNT, new Color()),
    z: Color.lerp(AXIS_COLOR.z, Color.WHITE, DRAG_HIGHLIGHT_AMOUNT, new Color()),
};

/**
 * One built handle primitive plus the pick ids of every instance, grouped by axis,
 * so a drag can recolor/hide instances per axis via `getGeometryInstanceAttributes`.
 */
export type GizmoHandles = {
    primitive: Primitive;
    idsByAxis: Record<GizmoAxis, GizmoPickId[]>;
};

/**
 * Rotation taking a cylinder's local +Z (its length axis) onto a world ENU axis:
 * identity for up, a ±90° turn for east/north.
 */
export const axisRotation = (axis: GizmoAxis): Matrix3 => {
    if (axis === 'x') {
        return Matrix3.fromRotationY(CesiumMath.PI_OVER_TWO, new Matrix3());
    }
    if (axis === 'y') {
        return Matrix3.fromRotationX(-CesiumMath.PI_OVER_TWO, new Matrix3());
    }
    return Matrix3.clone(Matrix3.IDENTITY, new Matrix3());
};

/**
 * Local transform for a cylinder part: slide it along +Z to `offset` (parts are
 * modeled centered on the origin), then rotate +Z onto the target axis.
 */
const partMatrix = (axis: GizmoAxis, offset: number): Matrix4 => {
    const rotation = Matrix4.fromRotationTranslation(axisRotation(axis), Cartesian3.ZERO, new Matrix4());
    const slide = Matrix4.fromTranslation(new Cartesian3(0, 0, offset), new Matrix4());
    return Matrix4.multiply(rotation, slide, new Matrix4());
};

const cylinderInstance = (
    geometry: CylinderGeometry,
    axis: GizmoAxis,
    offset: number,
    kind: GizmoHandleKind
): GeometryInstance => {
    const pickId: GizmoPickId = { [GIZMO_HANDLE_ID]: { axis, kind } };
    return new GeometryInstance({
        geometry,
        modelMatrix: partMatrix(axis, offset),
        attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(AXIS_COLOR[axis]),
            show: new ShowGeometryInstanceAttribute(true),
        },
        id: pickId,
    });
};

/**
 * Always-on-top render state: depth test off so handles stay visible (and
 * pickable) even when geometrically behind the model; depth writes off so they
 * never pollute the scene depth buffer. Other states fall back to Cesium defaults.
 */
const alwaysOnTopRenderState = (): object => {
    return {
        depthTest: { enabled: false },
        depthMask: false,
    };
};

/** A cube instance sat at the world `axis` end, carrying a scale pick id. */
const boxInstance = (geometry: BoxGeometry, axis: GizmoAxis, kind: GizmoHandleKind): GeometryInstance => {
    const pickId: GizmoPickId = { [GIZMO_HANDLE_ID]: { axis, kind } };
    return new GeometryInstance({
        geometry,
        modelMatrix: partMatrix(axis, CUBE_OFFSET),
        attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(AXIS_COLOR[axis]),
            show: new ShowGeometryInstanceAttribute(true),
        },
        id: pickId,
    });
};

/** A torus instance whose ring normal (+Z) is rotated onto the world `axis`. */
const torusInstance = (geometry: Geometry, axis: GizmoAxis, kind: GizmoHandleKind): GeometryInstance => {
    const pickId: GizmoPickId = { [GIZMO_HANDLE_ID]: { axis, kind } };
    return new GeometryInstance({
        geometry,
        modelMatrix: partMatrix(axis, 0),
        attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(AXIS_COLOR[axis]),
            show: new ShowGeometryInstanceAttribute(true),
        },
        id: pickId,
    });
};

/** Group instance pick ids by the axis they drive, for per-axis recolor/hide. */
const groupIdsByAxis = (instances: GeometryInstance[]): Record<GizmoAxis, GizmoPickId[]> => {
    const idsByAxis: Record<GizmoAxis, GizmoPickId[]> = { x: [], y: [], z: [] };
    for (const instance of instances) {
        const id = instance.id as GizmoPickId;
        idsByAxis[id[GIZMO_HANDLE_ID].axis].push(id);
    }
    return idsByAxis;
};

/** Wrap handle geometry instances in one always-on-top, flat-colored {@link Primitive}. */
const handlesPrimitive = (instances: GeometryInstance[]): GizmoHandles => {
    const primitive = new Primitive({
        geometryInstances: instances,
        appearance: new PerInstanceColorAppearance({
            flat: true,
            translucent: false,
            renderState: alwaysOnTopRenderState(),
        }),
        asynchronous: false,
        // Per-axis attributes are recolored/hidden during a drag.
        releaseGeometryInstances: false,
        // Rescaled per frame to keep a constant on-screen size; see transformGizmo.
        allowPicking: true,
    });
    return { primitive, idsByAxis: groupIdsByAxis(instances) };
};

/**
 * Reflect a drag in the handles: lighten the dragged axis and hide the other two,
 * so only the axis under the cursor stays visible while dragging. Pass `null` to
 * restore every axis to its base color and visibility on release.
 */
export const setDraggedAxis = (handles: GizmoHandles, axis: GizmoAxis | null): void => {
    const { primitive, idsByAxis } = handles;
    if (!primitive.ready) return;
    for (const a of AXES) {
        const dragging = axis !== null && a === axis;
        const color = dragging ? AXIS_HIGHLIGHT_COLOR[a] : AXIS_COLOR[a];
        const show = axis === null || dragging;
        for (const id of idsByAxis[a]) {
            const attributes = primitive.getGeometryInstanceAttributes(id);
            attributes.color = ColorGeometryInstanceAttribute.toValue(color);
            attributes.show = ShowGeometryInstanceAttribute.toValue(show);
        }
    }
};

/**
 * Reflect a hover in the handles: lighten the axis under the cursor toward white,
 * leaving every axis visible and the rest at their base color. Pass `null` to clear
 * the highlight. Used outside a drag, in every mode, so the hovered axis reads as
 * the one a click would grab.
 */
export const setHoveredAxis = (handles: GizmoHandles, axis: GizmoAxis | null): void => {
    const { primitive, idsByAxis } = handles;
    if (!primitive.ready) return;
    for (const a of AXES) {
        const hovered = axis !== null && a === axis;
        const color = hovered ? AXIS_HIGHLIGHT_COLOR[a] : AXIS_COLOR[a];
        for (const id of idsByAxis[a]) {
            const attributes = primitive.getGeometryInstanceAttributes(id);
            attributes.color = ColorGeometryInstanceAttribute.toValue(color);
            attributes.show = ShowGeometryInstanceAttribute.toValue(true);
        }
    }
};

/**
 * Hide every handle instance. Used on a rotate grab, where the colored rings are
 * replaced by the thin white ring stroke + yellow sector for the duration of the
 * drag; `setDraggedAxis(handles, null)` restores them on release.
 */
export const hideHandles = (handles: GizmoHandles): void => {
    const { primitive, idsByAxis } = handles;
    if (!primitive.ready) return;
    for (const a of AXES) {
        for (const id of idsByAxis[a]) {
            primitive.getGeometryInstanceAttributes(id).show = ShowGeometryInstanceAttribute.toValue(false);
        }
    }
};

/**
 * Wrap a local-space polyline path in an always-on-top, flat-colored line
 * {@link Primitive}, oriented into the `axis` ring plane via the same
 * {@link partMatrix} the rings use. `arcType` is `NONE` so segments are straight
 * chords (the path is already pre-sampled), and it is never pickable — feedback only.
 */
const strokePrimitive = (axis: GizmoAxis, positions: Cartesian3[], color: Color, width: number): Primitive => {
    const instance = new GeometryInstance({
        geometry: new PolylineGeometry({
            positions,
            width,
            colors: positions.map(() => {
                return color;
            }),
            colorsPerVertex: true,
            arcType: ArcType.NONE,
            vertexFormat: PolylineColorAppearance.VERTEX_FORMAT,
        }),
        modelMatrix: partMatrix(axis, 0),
    });
    return new Primitive({
        geometryInstances: instance,
        appearance: new PolylineColorAppearance({
            translucent: false,
            renderState: alwaysOnTopRenderState(),
        }),
        asynchronous: false,
        allowPicking: false,
    });
};

/**
 * Build the thin white ring stroke drawn over the active axis' ring during a rotate
 * drag: a closed polyline circle at the ring radius, in the axis' ring plane. Its
 * outer `modelMatrix` is driven each frame to match the rings (see `transformGizmo`).
 */
export const buildRingStrokePrimitive = (axis: GizmoAxis): Primitive => {
    const positions: Cartesian3[] = [];
    for (let i = 0; i <= RING_SEGMENTS; i++) {
        const angle = (2 * Math.PI * i) / RING_SEGMENTS;
        positions.push(new Cartesian3(RING_RADIUS * Math.cos(angle), RING_RADIUS * Math.sin(angle), 0));
    }
    return strokePrimitive(axis, positions, RING_STROKE_COLOR, RING_STROKE_WIDTH);
};

/**
 * Build the yellow stroke tracing the swept-angle sector's boundary: apex → arc
 * (`startAngle → endAngle` at the ring radius) → apex, so the wedge reads as a
 * solid outline over the translucent fill. Arc subdivision scales with the swept
 * span. Rebuilt as the angle changes, alongside the sector fill.
 */
export const buildSectorStrokePrimitive = (axis: GizmoAxis, startAngle: number, endAngle: number): Primitive => {
    const span = endAngle - startAngle;
    const arcSegments = Math.min(
        MAX_STROKE_ARC_SEGMENTS,
        Math.max(1, Math.ceil((Math.abs(span) / (2 * Math.PI)) * RING_SEGMENTS))
    );
    const positions: Cartesian3[] = [new Cartesian3(0, 0, STROKE_APEX_EPSILON)];
    for (let i = 0; i <= arcSegments; i++) {
        const angle = startAngle + (span * i) / arcSegments;
        positions.push(new Cartesian3(RING_RADIUS * Math.cos(angle), RING_RADIUS * Math.sin(angle), 0));
    }
    positions.push(new Cartesian3(0, 0, STROKE_APEX_EPSILON));
    return strokePrimitive(axis, positions, SECTOR_STROKE_COLOR, SECTOR_STROKE_WIDTH);
};

/**
 * Build the rotate gizmo as a single always-on-top {@link Primitive}: three rings
 * about the world ENU axes — heading (blue, up), pitch (red, east), roll (green,
 * north) — each a torus carrying a typed pick id so clicking it grabs that axis.
 */
export const createRotateHandles = (): GizmoHandles => {
    const ring = buildTorusGeometry({
        ringRadius: RING_RADIUS,
        tubeRadius: RING_TUBE_RADIUS,
        ringSegments: RING_SEGMENTS,
        tubeSegments: RING_TUBE_SEGMENTS,
    });
    return handlesPrimitive(
        AXES.map((axis) => {
            return torusInstance(ring, axis, 'rotate');
        })
    );
};

/**
 * Build the swept-angle sector as its own always-on-top, translucent
 * {@link Primitive}: a flat yellow "pie slice" {@link buildSectorGeometry} at the
 * ring radius, oriented into the grabbed axis' ring plane via the same per-axis
 * {@link partMatrix} the rings use, spanning the local-plane `startAngle → endAngle`.
 * Face culling is off so it reads from either side regardless of drag direction;
 * its outer `modelMatrix` is driven each frame to match the rings (see
 * `transformGizmo`). Not pickable — it is feedback only. Rebuilt as the swept angle
 * changes, so callers must `remove`/destroy the prior one.
 */
export const buildSectorPrimitive = (axis: GizmoAxis, startAngle: number, endAngle: number): Primitive => {
    const geometry = buildSectorGeometry({ radius: RING_RADIUS, startAngle, endAngle, segments: RING_SEGMENTS });
    const instance = new GeometryInstance({
        geometry,
        modelMatrix: partMatrix(axis, 0),
        attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(SECTOR_COLOR),
        },
    });
    return new Primitive({
        geometryInstances: instance,
        appearance: new PerInstanceColorAppearance({
            flat: true,
            translucent: true,
            renderState: { ...alwaysOnTopRenderState(), cull: { enabled: false } },
        }),
        asynchronous: false,
        allowPicking: false,
    });
};

/**
 * Build the translate gizmo as a single always-on-top {@link Primitive}: a red
 * east, green north, blue up arrow, each a shaft cylinder plus a cone arrowhead
 * sharing one typed pick id so clicking either part grabs that axis.
 */
export const createTranslateHandles = (): GizmoHandles => {
    const shaft = new CylinderGeometry({
        length: SHAFT_LENGTH,
        topRadius: SHAFT_RADIUS,
        bottomRadius: SHAFT_RADIUS,
        slices: SLICES,
        vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
    });
    const head = new CylinderGeometry({
        length: HEAD_LENGTH,
        topRadius: 0,
        bottomRadius: HEAD_RADIUS,
        slices: SLICES,
        vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
    });

    const instances = AXES.flatMap((axis) => {
        return [
            cylinderInstance(shaft, axis, SHAFT_LENGTH / 2, 'translate'),
            cylinderInstance(head, axis, SHAFT_LENGTH + HEAD_LENGTH / 2, 'translate'),
        ];
    });

    return handlesPrimitive(instances);
};

/**
 * Build the scale gizmo as a single always-on-top {@link Primitive}: a red east,
 * green north, blue up cube sat at each world ENU axis end, each carrying a typed
 * scale pick id. The three cubes act uniformly — grabbing any one scales the whole
 * model by a single factor — so they are cosmetically per-axis but never distort.
 */
export const createScaleHandles = (): GizmoHandles => {
    const cube = BoxGeometry.fromDimensions({
        dimensions: new Cartesian3(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE),
        vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
    });
    return handlesPrimitive(
        AXES.map((axis) => {
            return boxInstance(cube, axis, 'scale');
        })
    );
};
