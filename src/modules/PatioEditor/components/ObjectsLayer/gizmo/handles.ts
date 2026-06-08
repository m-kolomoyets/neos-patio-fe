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
    PointPrimitiveCollection,
    PolylineColorAppearance,
    PolylineGeometry,
    Primitive,
    Quaternion,
    ShowGeometryInstanceAttribute,
} from 'cesium';
import { buildSectorGeometry } from './sectorGeometry';
import { buildTorusGeometry } from './torusGeometry';
import { GIZMO_HANDLE_ID } from './types';

/**
 * Handle geometry, in local ENU units where `1.0` is rescaled to a fixed
 * on-screen pixel length each frame (see `transformGizmo`). Arrows run from the
 * origin out along each axis: a thin 3px shaft line capped by a cone arrowhead,
 * with a transparent pick cylinder spanning their full length so the thin visual
 * stays grabbable end to end.
 */
const SHAFT_LENGTH = 1;
const HEAD_LENGTH = 0.3;
const HEAD_RADIUS = 0.09;
const SLICES = 24;

/** Screen-space width (px) of the translate shaft polylines (same mechanism as ring strokes). */
const TRANSLATE_SHAFT_WIDTH = 3;

/** Radius of the transparent pick cylinder that makes a thin shaft line grabbable. */
const PICK_PROXY_RADIUS = 0.1;

/** Fully transparent fill of the pick proxy cylinder: invisible, but still pickable. */
const PICK_PROXY_COLOR = Color.TRANSPARENT;

/** Unit local direction of each axis, for building the shaft polylines directly. */
const AXIS_DIRECTION: Record<GizmoAxis, Cartesian3> = {
    x: new Cartesian3(1, 0, 0),
    y: new Cartesian3(0, 1, 0),
    z: new Cartesian3(0, 0, 1),
};

/** Rotation ring dimensions, in the same local ENU units as the arrows. */
const RING_RADIUS = 0.9;
const RING_TUBE_RADIUS = 0.022;
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
const CUBE_SIZE = 0.14;
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
 * Scale's grey→yellow palette (scale mode only): grey at rest so it reads as the
 * distinct, uniform operation it is, yellow on the hovered/dragged axis. The yellow
 * matches the rotate sector's so the active-axis cue stays coherent across modes.
 */
const SCALE_BASE_COLOR = Color.fromHsl(0, 0, 0.67);
const SCALE_HIGHLIGHT_COLOR = Color.YELLOW;

const SCALE_AXIS_COLOR: Record<GizmoAxis, Color> = { x: SCALE_BASE_COLOR, y: SCALE_BASE_COLOR, z: SCALE_BASE_COLOR };
const SCALE_AXIS_HIGHLIGHT_COLOR: Record<GizmoAxis, Color> = {
    x: SCALE_HIGHLIGHT_COLOR,
    y: SCALE_HIGHLIGHT_COLOR,
    z: SCALE_HIGHLIGHT_COLOR,
};

/**
 * One built handle primitive plus the pick ids of every instance, grouped by axis,
 * so a drag can recolor/hide instances per axis via `getGeometryInstanceAttributes`.
 */
export type GizmoHandles = {
    primitive: Primitive;
    idsByAxis: Record<GizmoAxis, GizmoPickId[]>;
    /** Per-axis resting color (RGB for translate/rotate, grey for scale). */
    baseColors: Record<GizmoAxis, Color>;
    /** Per-axis hover/drag color (lightened RGB for translate/rotate, yellow for scale). */
    highlightColors: Record<GizmoAxis, Color>;
    /**
     * Ids of transparent pick-proxy instances (translate's full-length pick
     * cylinders). Recolor skips these so they stay invisible; `show` still toggles
     * with the axis so a hidden axis can't be grabbed mid-drag.
     */
    pickProxyIds?: ReadonlySet<GizmoPickId>;
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
    kind: GizmoHandleKind,
    color: Color = AXIS_COLOR[axis]
): GeometryInstance => {
    const pickId: GizmoPickId = { [GIZMO_HANDLE_ID]: { axis, kind } };
    return new GeometryInstance({
        geometry,
        modelMatrix: partMatrix(axis, offset),
        attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(color),
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
const boxInstance = (geometry: BoxGeometry, axis: GizmoAxis, kind: GizmoHandleKind, color: Color): GeometryInstance => {
    const pickId: GizmoPickId = { [GIZMO_HANDLE_ID]: { axis, kind } };
    return new GeometryInstance({
        geometry,
        modelMatrix: partMatrix(axis, CUBE_OFFSET),
        attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(color),
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

/**
 * Wrap handle geometry instances in one always-on-top, flat-colored {@link Primitive}.
 * `translucent` is enabled for translate, whose transparent pick-proxy cylinders rely
 * on alpha blending to render invisibly while staying pickable.
 */
const handlesPrimitive = (
    instances: GeometryInstance[],
    translucent = false,
    baseColors: Record<GizmoAxis, Color> = AXIS_COLOR,
    highlightColors: Record<GizmoAxis, Color> = AXIS_HIGHLIGHT_COLOR
): GizmoHandles => {
    const primitive = new Primitive({
        geometryInstances: instances,
        appearance: new PerInstanceColorAppearance({
            flat: true,
            translucent,
            renderState: alwaysOnTopRenderState(),
        }),
        asynchronous: false,
        // Per-axis attributes are recolored/hidden during a drag.
        releaseGeometryInstances: false,
        // Rescaled per frame to keep a constant on-screen size; see transformGizmo.
        allowPicking: true,
    });
    return { primitive, idsByAxis: groupIdsByAxis(instances), baseColors, highlightColors };
};

/**
 * Reflect a drag in the handles: lighten the dragged axis and hide the other two,
 * so only the axis under the cursor stays visible while dragging. Pass `null` to
 * restore every axis to its base color and visibility on release. Pick-proxy
 * instances keep their (transparent) color and only follow the per-axis `show`.
 */
export const setDraggedAxis = (handles: GizmoHandles, axis: GizmoAxis | null): void => {
    const { primitive, idsByAxis, pickProxyIds, baseColors, highlightColors } = handles;
    if (!primitive.ready) return;
    for (const a of AXES) {
        const dragging = axis !== null && a === axis;
        const color = dragging ? highlightColors[a] : baseColors[a];
        const show = axis === null || dragging;
        for (const id of idsByAxis[a]) {
            const attributes = primitive.getGeometryInstanceAttributes(id);
            if (!pickProxyIds?.has(id)) {
                attributes.color = ColorGeometryInstanceAttribute.toValue(color);
            }
            attributes.show = ShowGeometryInstanceAttribute.toValue(show);
        }
    }
};

/**
 * Reflect a hover in the handles: lighten the axis under the cursor toward white,
 * leaving every axis visible and the rest at their base color. Pass `null` to clear
 * the highlight. Used outside a drag, in every mode, so the hovered axis reads as
 * the one a click would grab. Pick-proxy instances keep their (transparent) color.
 */
export const setHoveredAxis = (handles: GizmoHandles, axis: GizmoAxis | null): void => {
    const { primitive, idsByAxis, pickProxyIds, baseColors, highlightColors } = handles;
    if (!primitive.ready) return;
    for (const a of AXES) {
        const hovered = axis !== null && a === axis;
        const color = hovered ? highlightColors[a] : baseColors[a];
        for (const id of idsByAxis[a]) {
            const attributes = primitive.getGeometryInstanceAttributes(id);
            if (!pickProxyIds?.has(id)) {
                attributes.color = ColorGeometryInstanceAttribute.toValue(color);
            }
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
 * east, green north, blue up arrow, each a cone arrowhead plus a transparent
 * full-length pick cylinder sharing the axis' typed pick id, so clicking the head
 * or anywhere along the thin shaft line grabs that axis. The visible 3px shaft
 * lines are a separate polyline primitive (see {@link buildTranslateLinesPrimitive}),
 * since polylines and meshes can't share an appearance.
 */
export const createTranslateHandles = (): GizmoHandles => {
    const head = new CylinderGeometry({
        length: HEAD_LENGTH,
        topRadius: 0,
        bottomRadius: HEAD_RADIUS,
        slices: SLICES,
        vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
    });
    // Spans the whole arrow (shaft line + head) so the thin line stays grabbable.
    const pickLength = SHAFT_LENGTH + HEAD_LENGTH;
    const pick = new CylinderGeometry({
        length: pickLength,
        topRadius: PICK_PROXY_RADIUS,
        bottomRadius: PICK_PROXY_RADIUS,
        slices: SLICES,
        vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
    });

    const pickProxyIds = new Set<GizmoPickId>();
    const instances = AXES.flatMap((axis) => {
        const headInstance = cylinderInstance(head, axis, SHAFT_LENGTH + HEAD_LENGTH / 2, 'translate');
        const pickInstance = cylinderInstance(pick, axis, pickLength / 2, 'translate', PICK_PROXY_COLOR);
        pickProxyIds.add(pickInstance.id as GizmoPickId);
        return [headInstance, pickInstance];
    });

    const handles = handlesPrimitive(instances, true);
    handles.pickProxyIds = pickProxyIds;
    return handles;
};

/**
 * Per-axis color for the translate shaft lines given the current interaction state.
 * During a drag only the dragged axis is present (highlighted); at rest all three
 * are present, with the hovered axis (if any) highlighted — mirroring the head's
 * hover/drag behaviour in {@link setHoveredAxis} / {@link setDraggedAxis}.
 */
const axisLineColors = (
    hoveredAxis: GizmoAxis | null,
    draggedAxis: GizmoAxis | null,
    base: Record<GizmoAxis, Color>,
    highlight: Record<GizmoAxis, Color>
): Partial<Record<GizmoAxis, Color>> => {
    if (draggedAxis) return { [draggedAxis]: highlight[draggedAxis] };
    const colors: Partial<Record<GizmoAxis, Color>> = {};
    for (const axis of AXES) {
        colors[axis] = axis === hoveredAxis ? highlight[axis] : base[axis];
    }
    return colors;
};

export const translateLineColors = (
    hoveredAxis: GizmoAxis | null,
    draggedAxis: GizmoAxis | null
): Partial<Record<GizmoAxis, Color>> => {
    return axisLineColors(hoveredAxis, draggedAxis, AXIS_COLOR, AXIS_HIGHLIGHT_COLOR);
};

/** Per-axis color for the scale axis lines: grey at rest, yellow on the hovered/dragged axis. */
export const scaleLineColors = (
    hoveredAxis: GizmoAxis | null,
    draggedAxis: GizmoAxis | null
): Partial<Record<GizmoAxis, Color>> => {
    return axisLineColors(hoveredAxis, draggedAxis, SCALE_AXIS_COLOR, SCALE_AXIS_HIGHLIGHT_COLOR);
};

/**
 * Build the translate shaft lines as one always-on-top polyline {@link Primitive}:
 * a 3px screen-space line from the origin out to the shaft end along each axis in
 * `colorByAxis`, in that axis' color. Screen-space width is independent of the
 * per-frame gizmo scale (same mechanism as the rotate strokes). Not pickable — the
 * transparent pick-proxy cylinders carry picking. Rebuilt on hover/drag transitions,
 * so callers must `remove`/destroy the prior one.
 */
const buildAxisLinesPrimitive = (colorByAxis: Partial<Record<GizmoAxis, Color>>, length: number): Primitive => {
    const instances: GeometryInstance[] = [];
    for (const axis of AXES) {
        const color = colorByAxis[axis];
        if (!color) continue;
        const direction = AXIS_DIRECTION[axis];
        const positions = [
            Cartesian3.multiplyByScalar(direction, STROKE_APEX_EPSILON, new Cartesian3()),
            Cartesian3.multiplyByScalar(direction, length, new Cartesian3()),
        ];
        instances.push(
            new GeometryInstance({
                geometry: new PolylineGeometry({
                    positions,
                    width: TRANSLATE_SHAFT_WIDTH,
                    colors: positions.map(() => {
                        return color;
                    }),
                    colorsPerVertex: true,
                    arcType: ArcType.NONE,
                    vertexFormat: PolylineColorAppearance.VERTEX_FORMAT,
                }),
            })
        );
    }
    return new Primitive({
        geometryInstances: instances,
        appearance: new PolylineColorAppearance({
            translucent: false,
            renderState: alwaysOnTopRenderState(),
        }),
        asynchronous: false,
        allowPicking: false,
    });
};

export const buildTranslateLinesPrimitive = (colorByAxis: Partial<Record<GizmoAxis, Color>>): Primitive => {
    return buildAxisLinesPrimitive(colorByAxis, SHAFT_LENGTH);
};

/**
 * Build the scale axis lines: one 3px screen-space line from the origin out to each
 * cube in `colorByAxis`, sharing the {@link buildTranslateLinesPrimitive} mechanism
 * but running to the cube offset and carrying scale's grey/yellow palette.
 */
export const buildScaleLinesPrimitive = (colorByAxis: Partial<Record<GizmoAxis, Color>>): Primitive => {
    return buildAxisLinesPrimitive(colorByAxis, CUBE_OFFSET);
};

/** Yellow used for the dragged scale cube + its stretching line during a scale drag. */
export const scaleOverlayColor = (): Color => {
    return SCALE_HIGHLIGHT_COLOR;
};

/**
 * Local offset of the dragged scale cube along its axis during a drag: the resting
 * {@link CUBE_OFFSET} times the live `ratio` driving the uniform model scale, so the
 * cube sits under the cursor with no grab-time jump (ratio `1`) and tracks the scale.
 */
export const scaleCubeOffset = (ratio: number): number => {
    return CUBE_OFFSET * ratio;
};

/**
 * Build the scale drag's single stretching axis line: one 3px screen-space line
 * from the origin out to `length` along the dragged `axis`, in scale's yellow.
 * Rebuilt each drag frame as `length` grows/shrinks, so callers must `remove` the
 * prior one.
 */
export const buildScaleDragLinePrimitive = (axis: GizmoAxis, color: Color, length: number): Primitive => {
    return buildAxisLinesPrimitive({ [axis]: color }, length);
};

/**
 * Build the dragged scale cube as a standalone always-on-top, flat-colored
 * {@link Primitive}: a cube centered on the local origin (its world placement +
 * screen-constant size applied each frame via {@link scaleCubeMatrix}), so it can
 * slide along its axis to follow the cursor while the static handle cubes stay hidden.
 */
export const buildScaleCubePrimitive = (color: Color): Primitive => {
    const cube = BoxGeometry.fromDimensions({
        dimensions: new Cartesian3(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE),
        vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
    });
    const instance = new GeometryInstance({
        geometry: cube,
        attributes: { color: ColorGeometryInstanceAttribute.fromColor(color) },
    });
    return new Primitive({
        geometryInstances: instance,
        appearance: new PerInstanceColorAppearance({
            flat: true,
            translucent: false,
            renderState: alwaysOnTopRenderState(),
        }),
        asynchronous: false,
        allowPicking: false,
    });
};

/**
 * World matrix for the dragged scale cube: slide it `offset` along the local `axis`
 * within the gizmo's per-frame ENU `frame` (which already carries the screen-constant
 * scale), so the cube sits at the line's tip at a constant on-screen size.
 */
export const scaleCubeMatrix = (frame: Matrix4, axis: GizmoAxis, offset: number): Matrix4 => {
    const translation = Matrix4.fromTranslation(
        Cartesian3.multiplyByScalar(AXIS_DIRECTION[axis], offset, new Cartesian3()),
        new Matrix4()
    );
    return Matrix4.multiply(frame, translation, new Matrix4());
};

/**
 * Build the scale gizmo as a single always-on-top {@link Primitive}: a red east,
 * green north, blue up cube sat at each world ENU axis end, each carrying a typed
 * scale pick id. The three cubes act uniformly — grabbing any one scales the whole
 * model by a single factor — so they are cosmetically per-axis but never distort.
 * Grey at rest (scale-only palette), yellow on the hovered/dragged axis.
 */
export const createScaleHandles = (): GizmoHandles => {
    const cube = BoxGeometry.fromDimensions({
        dimensions: new Cartesian3(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE),
        vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
    });
    return handlesPrimitive(
        AXES.map((axis) => {
            return boxInstance(cube, axis, 'scale', SCALE_AXIS_COLOR[axis]);
        }),
        false,
        SCALE_AXIS_COLOR,
        SCALE_AXIS_HIGHLIGHT_COLOR
    );
};

/** Screen-space width (px) of the growing move arrow's world-space shaft line. */
const MOVE_ARROW_WIDTH = 3;

/** On-screen size (px) of the dot marking a move drag's frozen zero point. */
const MOVE_DOT_PIXEL_SIZE = 9;

/** Below this world length (m) the move shaft line is degenerate and skipped (dot only). */
const MIN_MOVE_LINE_LENGTH = 1e-3;

/** Color of a move drag's growing arrow + zero-point dot: the dragged axis' highlight. */
export const moveOverlayColor = (axis: GizmoAxis): Color => {
    return AXIS_HIGHLIGHT_COLOR[axis];
};

/** Rotation taking the local +Z axis onto a unit world `direction`, via the shortest arc. */
const rotationFromZTo = (direction: Cartesian3): Matrix3 => {
    const dir = Cartesian3.normalize(direction, new Cartesian3());
    const dot = Cartesian3.dot(Cartesian3.UNIT_Z, dir);
    if (dot > 1 - STROKE_APEX_EPSILON) return Matrix3.clone(Matrix3.IDENTITY, new Matrix3());
    if (dot < -1 + STROKE_APEX_EPSILON) return Matrix3.fromRotationX(Math.PI, new Matrix3());
    const axis = Cartesian3.normalize(Cartesian3.cross(Cartesian3.UNIT_Z, dir, new Cartesian3()), new Cartesian3());
    const quaternion = Quaternion.fromAxisAngle(axis, Math.acos(dot), new Quaternion());
    return Matrix3.fromQuaternion(quaternion, new Matrix3());
};

/**
 * Build the growing move arrow's shaft as a world-space 3px polyline from the
 * frozen `zero` point to the object's live `end` origin, in the dragged axis'
 * color. Drawn in world coordinates (identity model matrix) so its tip always
 * touches the object regardless of zoom. Rebuilt each drag frame as the object
 * moves, so callers must `remove`/destroy the prior one.
 */
export const buildMoveLinePrimitive = (zero: Cartesian3, end: Cartesian3, color: Color): Primitive => {
    const positions = [zero, end];
    const instance = new GeometryInstance({
        geometry: new PolylineGeometry({
            positions,
            width: MOVE_ARROW_WIDTH,
            colors: positions.map(() => {
                return color;
            }),
            colorsPerVertex: true,
            arcType: ArcType.NONE,
            vertexFormat: PolylineColorAppearance.VERTEX_FORMAT,
        }),
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

/** Whether two world points are far enough apart to draw a (non-degenerate) shaft line. */
export const hasMoveLine = (zero: Cartesian3, end: Cartesian3): boolean => {
    return Cartesian3.distance(zero, end) > MIN_MOVE_LINE_LENGTH;
};

/**
 * Build the growing move arrow's cone head as an always-on-top, flat-colored
 * {@link Primitive} centered on the local origin. Its world placement + screen-
 * constant size are applied each frame via {@link moveArrowHeadMatrix}.
 */
export const buildMoveArrowHeadPrimitive = (color: Color): Primitive => {
    const head = new CylinderGeometry({
        length: HEAD_LENGTH,
        topRadius: 0,
        bottomRadius: HEAD_RADIUS,
        slices: SLICES,
        vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
    });
    const instance = new GeometryInstance({
        geometry: head,
        attributes: { color: ColorGeometryInstanceAttribute.fromColor(color) },
    });
    return new Primitive({
        geometryInstances: instance,
        appearance: new PerInstanceColorAppearance({
            flat: true,
            translucent: false,
            renderState: alwaysOnTopRenderState(),
        }),
        asynchronous: false,
        allowPicking: false,
    });
};

/**
 * World matrix for the move arrow's cone head: orient local +Z along the drag
 * direction (`zero → end`, falling back to `axisDirection` when the drag is near
 * zero), uniformly `scale` it to a constant on-screen size, and place it so its
 * tip touches the object's live `end` origin.
 */
export const moveArrowHeadMatrix = (
    zero: Cartesian3,
    end: Cartesian3,
    axisDirection: Cartesian3,
    scale: number
): Matrix4 => {
    const span = Cartesian3.subtract(end, zero, new Cartesian3());
    const length = Cartesian3.magnitude(span);
    const direction =
        length > MIN_MOVE_LINE_LENGTH
            ? Cartesian3.multiplyByScalar(span, 1 / length, new Cartesian3())
            : Cartesian3.normalize(axisDirection, new Cartesian3());
    const center = Cartesian3.subtract(
        end,
        Cartesian3.multiplyByScalar(direction, (scale * HEAD_LENGTH) / 2, new Cartesian3()),
        new Cartesian3()
    );
    const matrix = Matrix4.fromRotationTranslation(rotationFromZTo(direction), center, new Matrix4());
    return Matrix4.multiplyByUniformScale(matrix, scale, matrix);
};

/**
 * Build the move drag's zero-point dot as a screen-constant {@link PointPrimitiveCollection}
 * at the frozen world `position`, in the dragged axis' color. Depth test is disabled
 * so it stays visible over the model (always-on-top, like the handle primitives).
 */
export const buildMoveDotCollection = (position: Cartesian3, color: Color): PointPrimitiveCollection => {
    const dots = new PointPrimitiveCollection();
    dots.add({
        position,
        pixelSize: MOVE_DOT_PIXEL_SIZE,
        color,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
    });
    return dots;
};
