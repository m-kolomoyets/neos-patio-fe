import {
    BoundingSphere,
    Cartesian3,
    ComponentDatatype,
    Geometry,
    GeometryAttribute,
    GeometryAttributes,
    PrimitiveType,
} from 'cesium';

type TorusOptions = {
    /** Radius from the torus centre to the centre of the tube. */
    ringRadius: number;
    /** Radius of the tube itself. */
    tubeRadius: number;
    /** Segments around the main ring (more = rounder ring). */
    ringSegments: number;
    /** Segments around the tube cross-section (more = rounder tube). */
    tubeSegments: number;
};

/**
 * Build a solid torus mesh in local space, lying in the local XY-plane with its
 * ring normal along +Z. Cesium ships no `TorusGeometry`, and a thin polyline ring
 * is unreliable to `scene.pick`; a real triangle tube is grabbable. Position-only
 * (no normals/st) since the gizmo uses a flat per-instance color appearance.
 *
 * The tube is a grid of `ringSegments × tubeSegments` vertices, wrapped in both
 * directions; each quad is two triangles. `ringSegments × tubeSegments` stays well
 * under 65536 so 16-bit indices suffice.
 */
export const buildTorusGeometry = ({ ringRadius, tubeRadius, ringSegments, tubeSegments }: TorusOptions): Geometry => {
    const positions = new Float64Array(ringSegments * tubeSegments * 3);
    const indices = new Uint16Array(ringSegments * tubeSegments * 6);

    for (let i = 0; i < ringSegments; i++) {
        const theta = (2 * Math.PI * i) / ringSegments;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        for (let j = 0; j < tubeSegments; j++) {
            const phi = (2 * Math.PI * j) / tubeSegments;
            const ringDist = ringRadius + tubeRadius * Math.cos(phi);

            const vertex = (i * tubeSegments + j) * 3;
            positions[vertex] = ringDist * cosTheta;
            positions[vertex + 1] = ringDist * sinTheta;
            positions[vertex + 2] = tubeRadius * Math.sin(phi);

            // Wrap both the ring (i) and the tube (j) back to the start.
            const nextI = (i + 1) % ringSegments;
            const nextJ = (j + 1) % tubeSegments;
            const a = i * tubeSegments + j;
            const b = nextI * tubeSegments + j;
            const c = nextI * tubeSegments + nextJ;
            const d = i * tubeSegments + nextJ;

            const quad = (i * tubeSegments + j) * 6;
            indices[quad] = a;
            indices[quad + 1] = b;
            indices[quad + 2] = c;
            indices[quad + 3] = a;
            indices[quad + 4] = c;
            indices[quad + 5] = d;
        }
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
        boundingSphere: new BoundingSphere(Cartesian3.ZERO, ringRadius + tubeRadius),
    });
};
