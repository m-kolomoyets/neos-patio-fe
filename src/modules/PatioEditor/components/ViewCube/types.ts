/** The 4 cardinal side faces of the cube. */
export type CubeFace = 'north' | 'east' | 'south' | 'west';

/** The 4 corner targets (3/4 isometric-style views). */
export type CubeCorner = 'northeast' | 'southeast' | 'southwest' | 'northwest';

/** Every clickable cube target: top face + 4 sides + 4 corners. Edges are unsupported. */
export type CubeTarget = 'top' | CubeFace | CubeCorner;

/** A camera framing the widget reads from / writes to the map. */
export type CameraState = {
    bearing: number;
    pitch: number;
    zoom: number;
};

/** A partial camera change applied via `easeTo` (or set live during drag). */
export type CameraTarget = {
    bearing?: number;
    pitch?: number;
    zoom?: number;
    center?: [lng: number, lat: number];
};

/**
 * A saved framing of the patio: a full camera snapshot the Home button returns
 * to. Persisted in localStorage keyed by patio id; defaults to the editor's
 * initial view state.
 */
export type HomeView = {
    center: [lng: number, lat: number];
    zoom: number;
    bearing: number;
    pitch: number;
};
