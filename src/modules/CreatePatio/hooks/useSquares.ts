import type { SquareRect } from '../types';
import type { MapCamera } from './useMapCamera';
import { useMemo } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { PATIO_SEED, PATIO_SIZE_M, START_COORDINATE } from '../constants';
import { metersToPixels } from '../utils/metersToPixels';
import { generatePatios } from '../utils/seededPatios';
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
 */
export const useSquares = (azimuthDeg: number): Squares | null => {
    const patios = useMemo(() => {
        return generatePatios(PATIO_SEED, START_COORDINATE);
    }, []);
    const camera = useMapCamera();
    const { current: mapRef } = useMap();

    if (!camera || !mapRef) return null;

    const map = mapRef.getMap();

    const center: SquareRect = {
        center: { x: camera.width / 2, y: camera.height / 2 },
        size: metersToPixels(PATIO_SIZE_M, camera.latitude, camera.zoom),
        azimuthDeg,
    };

    const patioSquares: PatioSquare[] = patios.features.map((feature, index) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        const point = map.project([longitude, latitude]);

        return {
            id: String(index),
            rect: {
                center: { x: point.x, y: point.y },
                size: metersToPixels(feature.properties.sizeMeters, latitude, camera.zoom),
                azimuthDeg: feature.properties.azimuthDeg,
            },
        };
    });

    return { camera, center, patios: patioSquares };
};
