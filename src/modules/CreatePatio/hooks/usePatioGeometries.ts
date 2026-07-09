import { useMemo } from 'react';
import { usePatioPoints } from '@/services/patios/queries';
import { START_COORDINATE } from '../constants';
import { derivePatioMapGeometry } from '../utils/derivePatioMapGeometry';

/** One patio's geo anchor + world orientation, keyed by its stable id. */
export type PatioGeometry = {
    id: string;
    longitude: number;
    latitude: number;
    /** Footprint azimuth in degrees, clockwise from north (world-anchored). */
    azimuthDeg: number;
};

/**
 * The relocated fixture set as geo anchors (id + longitude/latitude/azimuth),
 * memoized on the raw points. Shared by the overlay driver and the click
 * hit-test so both project the exact same patios each frame. Screen-pixel rects
 * are derived per frame from these — never stored in React state — so map
 * movement drives the SVG imperatively without re-rendering the tree.
 */
export const usePatioGeometries = (): PatioGeometry[] => {
    const { data: points } = usePatioPoints();

    return useMemo(() => {
        return (points?.features ?? []).map((feature) => {
            return { id: feature.properties.id, ...derivePatioMapGeometry(feature.properties.id, START_COORDINATE) };
        });
    }, [points]);
};
