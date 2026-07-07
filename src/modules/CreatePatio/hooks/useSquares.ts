import type { SquareRect } from '../types';
import type { MapCamera } from './useMapCamera';
import { useMemo } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { usePatioPoints } from '@/services/patios/queries';
import { PATIO_SIZE_M, START_COORDINATE } from '../constants';
import { derivePatioMapGeometry } from '../utils/derivePatioMapGeometry';
import { getProjectedNorthDeg } from '../utils/getProjectedNorthDeg';
import { metersToPixels } from '../utils/metersToPixels';
import { useMapCamera } from './useMapCamera';

export type PatioSquare = {
    id: string;
    rect: SquareRect;
};

export type Squares = {
    camera: MapCamera;
    center: SquareRect;
    patios: PatioSquare[];
};

/**
 * Single source of truth for the pixel geometry of every square each frame: the
 * center square (pinned to the viewport, sized from 100m at the current camera)
 * and the geo-anchored patio squares (each projected from its coordinate). One
 * shared computation keeps the base squares and the clipped intersection aligned
 * pixel-for-pixel. Returns null until the map is ready.
 *
 * The center square is drawn screen-upright (screen azimuth 0). Each patio's
 * screen azimuth is `worldAzimuth + getProjectedNorthDeg(...)` — the footprint's
 * real-world orientation plus the projected screen angle of north at its location
 * — so patios stay pinned to the world at any bearing and rotate rigidly with the
 * map. The morph markers in `ClusterMarkers` use the same helper to stay in sync.
 * Orientation is driven entirely by the projection, so no bearing arg is needed;
 * re-renders flow through `useMapCamera`.
 */
export const useSquares = (): Squares | null => {
    // `map.project` reads Mapbox's live (mutable) transform, which changes on every
    // rotate/pan/zoom without any React-tracked dep changing. The React Compiler
    // sees only a stable `map` ref + literal coords and would memoize the projected
    // pixels once — freezing the patio squares in place on rotation. Recompute each
    // frame instead; re-renders are driven by `useMapCamera`'s `render` sync.
    'use no memo';

    const { data: points } = usePatioPoints();
    const camera = useMapCamera();
    const { current: mapRef } = useMap();

    // Real patio ids relocated near the start via the shared derivation, so these
    // squares are exactly the points the browse view clusters on zoom-out.
    const patios = useMemo(() => {
        return (points?.features ?? []).map((feature) => {
            return { id: feature.properties.id, ...derivePatioMapGeometry(feature.properties.id, START_COORDINATE) };
        });
    }, [points]);

    if (!camera || !mapRef) return null;

    const map = mapRef.getMap();

    const center: SquareRect = {
        center: { x: camera.width / 2, y: camera.height / 2 },
        size: metersToPixels(PATIO_SIZE_M, camera.latitude, camera.zoom),
        // Screen-upright regardless of bearing; its bounds azimuth equals the bearing.
        azimuthDeg: 0,
    };

    const patioSquares: PatioSquare[] = patios.map((patio) => {
        const point = map.project([patio.longitude, patio.latitude]);

        return {
            id: patio.id,
            rect: {
                center: { x: point.x, y: point.y },
                size: metersToPixels(PATIO_SIZE_M, patio.latitude, camera.zoom),
                // Geo-anchored: orient by the world azimuth plus the projected screen
                // angle of north at this point, so the footprint stays pinned to the
                // world at any bearing. `ClusterMarkers` uses the same helper to sync.
                azimuthDeg: patio.azimuthDeg + getProjectedNorthDeg(map, patio.longitude, patio.latitude),
            },
        };
    });

    return { camera, center, patios: patioSquares };
};
