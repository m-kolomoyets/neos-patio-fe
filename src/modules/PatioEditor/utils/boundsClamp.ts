import type { PatioBounds } from '@/services/patios/types';
import { boundsAnchor, geoToScene } from './geoSceneProjection';

export type SceneBounds = { minX: number; maxX: number; minZ: number; maxZ: number };

// Project the patio bounds corners into scene meters (relative to the bounds-center
// anchor) once, yielding the min/max x and z that horizontally constrain objects.
export const deriveSceneBounds = (bounds: PatioBounds): SceneBounds => {
    const [west, south, east, north] = bounds;
    const anchor = boundsAnchor(bounds);
    const sw = geoToScene(anchor, { lng: west, lat: south });
    const ne = geoToScene(anchor, { lng: east, lat: north });
    return {
        minX: Math.min(sw.x, ne.x),
        maxX: Math.max(sw.x, ne.x),
        minZ: Math.min(sw.z, ne.z),
        maxZ: Math.max(sw.z, ne.z),
    };
};

// Clamp a point to the scene bounds on x and z only; y is passed through untouched.
export const clampToSceneBounds = (sceneBounds: SceneBounds, point: { x: number; z: number }) => {
    return {
        x: Math.min(Math.max(point.x, sceneBounds.minX), sceneBounds.maxX),
        z: Math.min(Math.max(point.z, sceneBounds.minZ), sceneBounds.maxZ),
    };
};
