/** Small latitude step (~1m is enough) used to sample the north direction. */
const NORTH_PROBE_DELTA_DEG = 0.0001;

/**
 * On-screen angle of world-north at a given coordinate, in degrees clockwise from
 * screen-up. Derived straight from the live map projection: project the point and
 * a second point just north of it, then take the angle of the screen vector
 * between them. This captures exactly how much the map has rotated that spot —
 * for any bearing, projection (globe/mercator), and latitude — so a footprint's
 * screen rotation is simply `worldAzimuthDeg + getProjectedNorthDeg(...)`, keeping
 * it pinned to the world instead of tracking the raw `bearing` value (whose sign
 * convention flips between conventions). Reads live mutable map state; call each
 * frame.
 */
export const getProjectedNorthDeg = (map: mapboxgl.Map, longitude: number, latitude: number): number => {
    const here = map.project([longitude, latitude]);
    const north = map.project([longitude, latitude + NORTH_PROBE_DELTA_DEG]);

    const dx = north.x - here.x;
    const dy = north.y - here.y;

    // Clockwise from screen-up (−y): up → 0°, right → 90°.
    return (Math.atan2(dx, -dy) * 180) / Math.PI;
};
