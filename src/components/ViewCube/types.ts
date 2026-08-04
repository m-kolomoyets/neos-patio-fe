import type { MapInteraction, WithClassName } from '@/lib/types';
import type { PatioBounds } from '@/services/patios/types';

/** The 4 cardinal side faces of the cube. */
export type CubeFace = 'north' | 'east' | 'south' | 'west';

/** The 4 corner targets: true top-vertex isometric 3/4 views (top + two sides). */
export type CubeCorner = 'northeast' | 'southeast' | 'southwest' | 'northwest';

/** The 4 vertical edges: corner-on views framing two adjacent side faces. */
export type CubeVerticalEdge = 'edge-ne' | 'edge-se' | 'edge-sw' | 'edge-nw';

/** The 4 top edges: tilted views framing the top plus one side. */
export type CubeTopEdge = 'edge-top-n' | 'edge-top-e' | 'edge-top-s' | 'edge-top-w';

/** Every clickable cube target: top face + 4 sides + 4 corners + 8 edges. */
export type CubeTarget = 'top' | CubeFace | CubeCorner | CubeVerticalEdge | CubeTopEdge;

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

/** A face that carries a 3×3 hit grid (the cube's underside is never rendered). */
export type FaceId = 'top' | CubeFace;

/** A cube-body direction; each component ∈ {-1, 0, 1}. */
export type Axis3 = readonly [number, number, number];

/**
 * ViewCube navigation widget (bottom-right overlay).
 *
 * A CSS 3D cube whose perspective mirrors the live Cesium camera, acting as a
 * combined compass + pitch indicator (#02). Faces/corners carry `data-face` for
 * hover and, via {@link useCubeInteraction}, click-to-snap + drag-to-orbit
 * (#03). Clicking a side face flattens the cube to that face with step arrows
 * (#04). No three.js / GL — pure DOM + CSS transforms.
 *
 * The camera adapter ({@link useCesiumCamera}) models every move as a
 * `lookAt(target, HeadingPitchRange)` around the patio bounds centre. The live
 * camera subscription is pushed down into the {@link CubeView} and
 * {@link LiveZoomControl} leaves, so this shell does not re-render per frame.
 */
export type ViewCubeProps = WithClassName<{
    /** Patio bounds framed by the camera; the orbit target is its centre. */
    bounds: PatioBounds;
    /** The patio's look-at offset above ground (`Patio.height`); raises the orbit pivot. */
    height?: number;
    /** Stable id (the patio id) keying the per-patio Home-view localStorage entry. */
    storageId: string;
    /**
     * Camera mode. In `'view'` the cube's orbit/zoom pivot on the fixed bounds
     * centre (center-locked, agrees with the map drags); `'edit'` (default)
     * pivots on the viewport-centre ground pick.
     */
    interaction?: MapInteraction;
}>;
