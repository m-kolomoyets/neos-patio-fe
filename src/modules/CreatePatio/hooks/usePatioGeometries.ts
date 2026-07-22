import type { IndicatorType } from '../types';
import { useMemo } from 'react';
import { START_COORDINATE } from '../constants';
import { derivePatioMapGeometry } from '../utils/derivePatioMapGeometry';
import { resolveIndicatorType } from '../utils/resolveIndicatorType';
import { usePatioPointsWithOwnership } from './usePatioPointsWithOwnership';

/** One patio's geo anchor + world orientation, keyed by its stable id. */
export type PatioGeometry = {
    id: string;
    longitude: number;
    latitude: number;
    /** Footprint azimuth in degrees, clockwise from north (world-anchored). */
    azimuthDeg: number;
    /** Indicator palette entry this square paints with (published × mine). */
    indicatorType: IndicatorType;
};

/**
 * The relocated fixture set as geo anchors (id + longitude/latitude/azimuth +
 * indicator type), memoized on the ownership-resolved points. Shared by the
 * overlay driver and the click hit-test so both project the exact same patios
 * each frame. Screen-pixel rects are derived per frame from these — never stored
 * in React state — so map movement drives the SVG imperatively without
 * re-rendering the tree. Connecting/switching wallets *does* re-render: the
 * indicator types change, which is structural.
 */
export const usePatioGeometries = (): PatioGeometry[] => {
    const points = usePatioPointsWithOwnership();

    return useMemo(() => {
        return points.features.map((feature) => {
            const { id, isPublished, isMine } = feature.properties;

            return {
                id,
                indicatorType: resolveIndicatorType(isPublished, isMine),
                ...derivePatioMapGeometry(id, START_COORDINATE),
            };
        });
    }, [points]);
};
