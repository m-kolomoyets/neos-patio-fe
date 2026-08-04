import type { CSSProperties } from 'react';
import type { IndicatorType } from '../../types';

export type BaseMarker = {
    /** Stable dedupe/render key: cluster id or patio id. */
    key: string;
    longitude: number;
    latitude: number;
    /** Member count: cluster size, or `1` for a lone patio. */
    count: number;
    /** Blue treatment: cluster holds unpublished work, or the lone patio is unpublished. */
    hasUnpublished: boolean;
};

/** A count bubble; taps fly the camera down to where it breaks apart. */
export type ClusterMarker = BaseMarker & { cluster: true; clusterId: number };
/** A lone patio; taps select it via the shared selection path. */
export type SingletonMarker = BaseMarker & { cluster: false; patioId: string; indicatorType: IndicatorType };
export type PatioMarker = ClusterMarker | SingletonMarker;

/** Indicator palette entry a badge paints with, as CSS custom properties. */
export type IndicatorVars = CSSProperties & {
    '--indicator-fill': string;
    '--indicator-glow': string;
};

/** CSS custom properties the morph driver / initial render write onto a marker. */
export type MorphVars = IndicatorVars & {
    '--morph-size': string;
    '--morph-radius': string;
    '--morph-text-opacity': string;
    '--morph-rotate': string;
    '--crossfade-opacity': string;
};
