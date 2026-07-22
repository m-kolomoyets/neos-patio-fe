import type { Scale } from '../utils/buildScale';
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID, SATELLITE_RASTER_LAYER_ID } from '../../../constants';
import { buildScale } from '../utils/buildScale';
import { measureMetersPerPixel } from '../utils/measureMetersPerPixel';

/** Text/tick theme: `light` (white) over dark satellite, `dark` (black) over light aerial. */
export type ScaleVariant = 'light' | 'dark';

type ScaleState = Scale & { variant: ScaleVariant };

const INITIAL: ScaleState = { ticks: [], pxPerMeter: 0, unit: 'm', variant: 'light' };

const isSameScale = (a: ScaleState, b: ScaleState) => {
    return (
        a.variant === b.variant &&
        a.unit === b.unit &&
        a.pxPerMeter === b.pxPerMeter &&
        a.ticks.length === b.ticks.length &&
        a.ticks.at(-1) === b.ticks.at(-1)
    );
};

/**
 * Drives the scale bar off the map's camera-*end* events: it settles after a
 * gesture instead of churning every frame, which matters now that a settle can
 * add or remove tick nodes. The track width is fixed — what changes is the step,
 * the number of ticks that fit, and where each one lands.
 *
 * `variant` is read from the satellite raster's live opacity (the same source of
 * truth `MapViewTabs` writes via `setPaintProperty`), so no shared React state or
 * `useMapView` refactor is needed.
 */
export const useScaleBarDriver = () => {
    const maps = useMap();
    // `current` is set only inside the `<Map>` subtree; fall back to the registry id
    // so a sibling overlay still resolves the map. Depend on the resolved ref so the
    // effect re-subscribes once the map registers.
    const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];
    const barRef = useRef<HTMLDivElement | null>(null);
    const [state, setState] = useState<ScaleState>(INITIAL);

    useEffect(() => {
        const map = mapRef?.getMap();
        if (!map) return;

        const apply = () => {
            const barElement = barRef.current;
            if (!barElement) return;

            const scale = buildScale(measureMetersPerPixel(map, barElement));

            // Satellite raster opacity: 1 over satellite (light text), 0 over aerial
            // (dark text). During the cross-fade the 0.5 threshold flips it once.
            let variant: ScaleVariant = 'light';
            if (map.getLayer(SATELLITE_RASTER_LAYER_ID)) {
                const opacity = map.getPaintProperty(SATELLITE_RASTER_LAYER_ID, 'raster-opacity');
                variant = (typeof opacity === 'number' ? opacity : 1) > 0.5 ? 'light' : 'dark';
            }

            const next: ScaleState = { ...scale, variant };

            setState((prev) => {
                return isSameScale(prev, next) ? prev : next;
            });
        };

        apply();
        // Settle-only: recompute once a camera gesture ends (pan/zoom/pitch/rotate),
        // plus on `idle` for programmatic flights and the base-map cross-fade.
        const events = ['moveend', 'zoomend', 'pitchend', 'rotateend', 'idle'] as const;
        events.forEach((event) => {
            return map.on(event, apply);
        });

        return () => {
            events.forEach((event) => {
                return map.off(event, apply);
            });
        };
    }, [mapRef]);

    return { barRef, ...state };
};
