import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID, SATELLITE_RASTER_LAYER_ID } from '../../../constants';
import { SCALE_BAR_MAX_WIDTH_PX, SCALE_BAR_SEGMENTS } from '../constants';
import { metersToPixels } from '../../../utils/metersToPixels';
import { niceStep } from '../utils/niceStep';

/** Text/tick theme: `light` (white) over dark satellite, `dark` (black) over light aerial. */
export type ScaleVariant = 'light' | 'dark';

type ScaleState = { step: number; variant: ScaleVariant };

/**
 * Drives the scale bar off the map's `render` event. The *width* changes every
 * frame during a zoom gesture, so it's written imperatively to a CSS var on the
 * wrap element (`--scale-bar-w`) — never through React. The *step* (label values)
 * and *variant* (base-map theme) change only on a rung / base-map crossing, so
 * they live in state whose setter bails on an unchanged value, re-rendering the
 * labels at most once per crossing rather than per frame.
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
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const [state, setState] = useState<ScaleState>({ step: 0, variant: 'light' });

    useEffect(() => {
        const map = mapRef?.getMap();
        if (!map) return;

        const apply = () => {
            const zoom = map.getZoom();
            const latitude = map.getCenter().lat;

            // px for 1 m at this camera; its inverse is meters-per-pixel.
            const pixelsPerMeter = metersToPixels(1, latitude, zoom);
            if (!(pixelsPerMeter > 0)) return;

            const maxMeters = SCALE_BAR_MAX_WIDTH_PX / pixelsPerMeter;
            const step = niceStep(maxMeters / SCALE_BAR_SEGMENTS);
            const widthPx = metersToPixels(step * SCALE_BAR_SEGMENTS, latitude, zoom);

            wrapRef.current?.style.setProperty('--scale-bar-w', `${widthPx}px`);

            // Satellite raster opacity: 1 over satellite (light text), 0 over aerial
            // (dark text). During the cross-fade the 0.5 threshold flips it once.
            let variant: ScaleVariant = 'light';
            if (map.getLayer(SATELLITE_RASTER_LAYER_ID)) {
                const opacity = map.getPaintProperty(SATELLITE_RASTER_LAYER_ID, 'raster-opacity');
                variant = (typeof opacity === 'number' ? opacity : 1) > 0.5 ? 'light' : 'dark';
            }

            setState((prev) => {
                return prev.step === step && prev.variant === variant ? prev : { step, variant };
            });
        };

        apply();
        map.on('render', apply);

        return () => {
            map.off('render', apply);
        };
    }, [mapRef]);

    return { wrapRef, step: state.step, variant: state.variant };
};
