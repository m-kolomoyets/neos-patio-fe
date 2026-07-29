import type { Map as MapboxMap } from 'mapbox-gl';
import { SCALE_BAR_MAX_METERS_PER_PIXEL, SCALE_BAR_TRACK_INSET_PX, SCALE_BAR_USABLE_WIDTH_PX } from '../constants';

/**
 * Ground meters per screen pixel *for the row the bar actually sits on*.
 *
 * A pure Web Mercator conversion is only honest top-down: under pitch a pixel near
 * the top of the viewport covers far more ground than one at the center. So the
 * bar's own rect is projected into canvas space and the two ends of its baseline
 * are unprojected, giving the real distance those pixels span.
 *
 * Meters-per-pixel is non-linear across a pitched bar; sampling end-to-end and
 * placing ticks linearly is the accepted approximation (left ticks read slightly
 * short, right slightly long) — the alternative is one unproject per tick.
 *
 * Returns `0` when the row is degenerate (at/above the horizon), which hides the bar.
 */
export const measureMetersPerPixel = (map: MapboxMap, barElement: HTMLElement): number => {
    const bar = barElement.getBoundingClientRect();
    const box = map.getContainer().getBoundingClientRect();
    if (!bar.width) return 0;

    const y = bar.top - box.top + bar.height / 2;
    const x = bar.left - box.left + SCALE_BAR_TRACK_INSET_PX;

    const start = map.unproject([x, y]);
    const end = map.unproject([x + SCALE_BAR_USABLE_WIDTH_PX, y]);
    const meters = start.distanceTo(end);
    if (!Number.isFinite(meters) || meters <= 0) return 0;

    const metersPerPixel = meters / SCALE_BAR_USABLE_WIDTH_PX;

    return metersPerPixel > SCALE_BAR_MAX_METERS_PER_PIXEL ? 0 : metersPerPixel;
};
