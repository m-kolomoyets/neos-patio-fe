import type { CubeCorner, CubeFace, CubeTarget, CubeTopEdge, CubeVerticalEdge } from '../types';

/** A face that carries a 3×3 hit grid (the cube's underside is never rendered). */
export type FaceId = 'top' | CubeFace;

/** Row/col indices of a face's 3×3 grid, top-left = (0,0). */
export const GRID_INDICES = [0, 1, 2] as const;

/** A cube-body direction; each component ∈ {-1, 0, 1}. */
type Axis3 = readonly [number, number, number];

/**
 * Body-frame basis of each face's local 3×3 grid.
 *
 * Cube-body axes (derived from the CSS face transforms): `x` E+ / W−, `y` S+ /
 * N−, `z` Top+ / Bottom−. `fixed` is the face's outward normal; `ax`/`ay` are
 * the body directions its grid columns / rows advance along. A cell's body
 * vector is `fixed + ax·(col−1) + ay·(row−1)` — see {@link cellVector}.
 */
const FACE_BASIS: Record<FaceId, { fixed: Axis3; ax: Axis3; ay: Axis3 }> = {
    top: { fixed: [0, 0, 1], ax: [1, 0, 0], ay: [0, 1, 0] },
    north: { fixed: [0, -1, 0], ax: [1, 0, 0], ay: [0, 0, 1] },
    south: { fixed: [0, 1, 0], ax: [1, 0, 0], ay: [0, 0, -1] },
    east: { fixed: [1, 0, 0], ax: [0, -1, 0], ay: [0, 0, -1] },
    west: { fixed: [-1, 0, 0], ax: [0, 1, 0], ay: [0, 0, -1] },
};

/** Compose the compass corner from a vertex's E/W and N/S body signs. */
const vertexName = (x: number, y: number): CubeCorner => {
    const ns = y < 0 ? 'north' : 'south';
    const ew = x > 0 ? 'east' : 'west';
    return `${ns}${ew}` as CubeCorner;
};

/** Vertical edge between two adjacent sides, from its E/W and N/S body signs. */
const verticalEdgeName = (x: number, y: number): CubeVerticalEdge => {
    return `edge-${y < 0 ? 'n' : 's'}${x > 0 ? 'e' : 'w'}` as CubeVerticalEdge;
};

/** Top edge between the top and one side, from whichever of E/W or N/S is set. */
const topEdgeName = (x: number, y: number): CubeTopEdge => {
    let dir: string;
    if (y !== 0) dir = y < 0 ? 'n' : 's';
    else dir = x > 0 ? 'e' : 'w';
    return `edge-top-${dir}` as CubeTopEdge;
};

/** Cube-body vector of a face's `(col,row)` cell; each component ∈ {-1, 0, 1}. */
const cellVector = (face: FaceId, col: number, row: number): Axis3 => {
    const { fixed, ax, ay } = FACE_BASIS[face];
    const u = col - 1;
    const v = row - 1;
    return [fixed[0] + ax[0] * u + ay[0] * v, fixed[1] + ax[1] * u + ay[1] * v, fixed[2] + ax[2] * u + ay[2] * v];
};

/**
 * Resolve a face's 3×3 grid cell → the {@link CubeTarget} a click on it snaps to.
 *
 * Classifies the cell by its body vector. A true corner (all 3 axes nonzero)
 * resolves to its top-vertex iso view; an edge (exactly 2 axes nonzero) resolves
 * to a vertical edge (z = 0) or a top edge (z > 0). Anything on the cube's
 * underside (z < 0) and the face center fall back to the face itself, so there
 * are no dead zones. Pure + testable: face + cell → target.
 */
export const faceCellTarget = (face: FaceId, col: number, row: number): CubeTarget => {
    const fallback: CubeTarget = face;
    const [x, y, z] = cellVector(face, col, row);
    const nonZero = (x !== 0 ? 1 : 0) + (y !== 0 ? 1 : 0) + (z !== 0 ? 1 : 0);
    if (nonZero === 3) return z > 0 ? vertexName(x, y) : fallback;
    if (nonZero === 2) {
        if (z === 0) return verticalEdgeName(x, y);
        if (z > 0) return topEdgeName(x, y);
    }
    return fallback;
};
