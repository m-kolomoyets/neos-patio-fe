import type { Axis3, CubeCorner, CubeTarget, CubeTopEdge, CubeVerticalEdge, FaceId } from '../types';
import { FACE_BASIS } from '../constants';

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
