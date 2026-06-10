/** The 4 cardinal side faces of the cube. */
export type CubeFace = 'north' | 'east' | 'south' | 'west';

/** The 4 corner targets (3/4 isometric-style views). */
export type CubeCorner = 'northeast' | 'southeast' | 'southwest' | 'northwest';

/** Every clickable cube target: top face + 4 sides + 4 corners. Edges are unsupported. */
export type CubeTarget = 'top' | CubeFace | CubeCorner;

/**
 * A camera framing the widget reads from / writes to the Cesium camera.
 *
 * `bearing`/`pitch` are display degrees (the cube's maplibre-style convention:
 * pitch 0 = top-down, {@link MAX_PITCH} ≈ horizon), `range` is the camera's
 * distance to the orbit target in meters. Cesium-native heading/pitch radians
 * are an adapter detail; the widget speaks display units throughout.
 */
export type CameraState = {
    bearing: number;
    pitch: number;
    range: number;
};

/** A partial camera change applied via `easeTo` (or set live during drag). */
export type CameraTarget = {
    bearing?: number;
    pitch?: number;
    range?: number;
};

/**
 * A saved framing of the patio: the orbit orientation + range the Home button
 * returns to. Persisted in localStorage keyed by patio id; defaults to the
 * editor's initial framing (heading 0, pitch -45°, patio-diagonal range).
 */
export type HomeView = {
    bearing: number;
    pitch: number;
    range: number;
};
