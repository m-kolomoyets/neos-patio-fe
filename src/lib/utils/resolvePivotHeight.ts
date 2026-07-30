/** Inputs the camera pivot height is derived from. */
type PivotHeightInput = {
    /**
     * Ground elevation (m above the WGS84 ellipsoid) sampled under the patio
     * centre, or `undefined` when the scene cannot answer yet — tiles not
     * streamed, or height sampling unsupported on this device.
     */
    ground: number | undefined;
    /** The patio's authored look-at offset above ground (`Patio.height`). */
    patioHeight: number;
    /**
     * Best (highest) ground elevation resolved so far for this patio, or
     * `undefined` on the first resolution. See the never-lower rule below.
     */
    best?: number;
};

/** A resolved pivot: the height to place the look-at point at, plus the ground it came from. */
type PivotHeight = {
    /** Absolute height (m above the ellipsoid) for the camera's look-at point. */
    height: number;
    /**
     * Ground elevation this was derived from, to carry forward as the next call's
     * `best`. `undefined` while ground is still unknown, so a later real sample is
     * never treated as a downward refinement of a guess.
     */
    best: number | undefined;
};

/**
 * Resolve the absolute height of the camera orbit pivot for a patio.
 *
 * The patio's `height` is authored relative to the ground plane, so the pivot is
 * `ground + height` — the whole point being that the camera never aims at a
 * point buried under the tileset mesh (an ellipsoid-height pivot sits ~200m
 * below the surface at, say, Prague Castle).
 *
 * **Never lower.** Ground arrives progressively: a cheap synchronous depth-buffer
 * sample as soon as tiles paint, then an authoritative most-detailed sample. A
 * coarse LOD reads *lower* than the real surface, so accepting every sample
 * would visibly dip the pivot into the mesh mid-refinement. Keeping the highest
 * ground seen makes refinement monotonic upward.
 *
 * **Unknown ground.** With no sample at all (`sampleHeightSupported === false`,
 * or nothing streamed yet) this falls back to ellipsoid height + the patio
 * offset. That can still sit under the mesh on elevated terrain — nothing in the
 * scene can report where the ground is, so there is no better answer; it simply
 * preserves the pre-existing behaviour rather than blanking the pivot and
 * leaving the map's orbit controls inert.
 */
export const resolvePivotHeight = ({ ground, patioHeight, best }: PivotHeightInput): PivotHeight => {
    const resolved = ground === undefined ? best : Math.max(ground, best ?? ground);
    return {
        height: (resolved ?? 0) + patioHeight,
        best: resolved,
    };
};
