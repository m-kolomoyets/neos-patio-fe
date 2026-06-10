import {
    BoundingSphere,
    Cartesian3,
    ComponentDatatype,
    Geometry,
    GeometryAttribute,
    GeometryAttributes,
    PrimitiveType,
} from 'cesium';

type SectorOptions = {
    /** Radius the fan's arc sits at (the ring radius, so it fills the active ring). */
    radius: number;
    /** Local-plane angle (radians) the fan starts at — the grab/start-spoke direction. */
    startAngle: number;
    /** Local-plane angle (radians) the fan ends at — the current cursor direction. */
    endAngle: number;
    /** Arc segments for a full 2π turn; the actual count scales with the swept span. */
    segments: number;
};

/** Keep the vertex/index count inside 16-bit range even for big multi-turn spans. */
const MAX_ARC_SEGMENTS = 8192;

/**
 * Nudge the fan's apex off the exact local origin. Cesium's `Primitive` projects
 * every geometry to 2D (for morph support) using only the per-instance rotation —
 * no translation — so a vertex at local `(0,0,0)` lands at the Earth's centre,
 * where `Ellipsoid.cartesianToCartographic` returns `undefined` and the render
 * throws. Any non-zero offset avoids it; this is sub-millimetre at gizmo scale, so
 * the apex still reads as centred.
 */
const APEX_EPSILON = 1e-6;

/**
 * Build a flat triangle-fan "pie slice" mesh in local space, lying in the local
 * XY-plane with its normal along +Z — the same frame `buildTorusGeometry` uses, so
 * a sector instance shares the rings' per-axis orientation. The fan runs from a
 * centre vertex out to an arc of `radius` vertices spanning `[startAngle, endAngle]`,
 * winding in the drag's direction (positive vs negative span). Position-only, for
 * the flat per-instance color appearance.
 *
 * Segment count scales with the swept span (capped at {@link MAX_ARC_SEGMENTS}) so
 * the arc stays smooth and the index count stays well under 65536 — 16-bit indices
 * suffice, same invariant the torus relies on. A zero span yields a degenerate
 * (zero-area) sliver.
 */
export const buildSectorGeometry = ({ radius, startAngle, endAngle, segments }: SectorOptions): Geometry => {
    const span = endAngle - startAngle;
    const arcSegments = Math.min(MAX_ARC_SEGMENTS, Math.max(1, Math.ceil((Math.abs(span) / (2 * Math.PI)) * segments)));

    // Centre vertex (origin) + one vertex per arc step.
    const vertexCount = arcSegments + 2;
    const positions = new Float64Array(vertexCount * 3);

    // Apex vertex — at the centre, lifted off exact `(0,0,0)` (see APEX_EPSILON).
    positions[2] = APEX_EPSILON;
    for (let i = 0; i <= arcSegments; i++) {
        const angle = startAngle + (span * i) / arcSegments;
        const vertex = (i + 1) * 3;
        positions[vertex] = radius * Math.cos(angle);
        positions[vertex + 1] = radius * Math.sin(angle);
        positions[vertex + 2] = 0;
    }

    const indices = new Uint16Array(arcSegments * 3);
    for (let i = 0; i < arcSegments; i++) {
        const tri = i * 3;
        indices[tri] = 0;
        indices[tri + 1] = i + 1;
        indices[tri + 2] = i + 2;
    }

    const attributes = new GeometryAttributes();
    attributes.position = new GeometryAttribute({
        componentDatatype: ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: positions,
    });

    return new Geometry({
        attributes,
        indices,
        primitiveType: PrimitiveType.TRIANGLES,
        boundingSphere: new BoundingSphere(Cartesian3.ZERO, radius),
    });
};
