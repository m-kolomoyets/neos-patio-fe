import clsx from 'clsx';
import { Typography } from '@/components/ui/Typography';
import { SCALE_BAR_KM_THRESHOLD_M, SCALE_BAR_MIN_ZOOM, SCALE_BAR_TRACK_INSET_PX } from './constants';
import { useZoomAtLeast } from '../../hooks/useZoomAtLeast';
import { useScaleBarDriver } from './hooks/useScaleBarDriver';
import s from './styles.module.css';

/**
 * Top-down scale bar for the create map. The track pill is a fixed width and the
 * baseline always spans it; what varies is the 1-2-5 step and how many ticks fit
 * inside — so ticks reposition (and the run ends short of the right edge) instead
 * of the wrapper resizing. Recomputed only when the camera settles.
 *
 * Ticks are keyed by their meter value, so the ones that survive a step change
 * keep their DOM node and slide to the new position; the rest fade in / unmount.
 */
const ScaleBarInner: React.FC = () => {
    const { barRef, ticks, pxPerMeter, unit, variant } = useScaleBarDriver();
    const offsetOf = (meters: number) => {
        return `${SCALE_BAR_TRACK_INSET_PX + meters * pxPerMeter}px`;
    };

    return (
        <div className={clsx(s.wrap, ticks.length === 0 && s.hidden)} data-variant={variant} aria-hidden="true">
            <div className={s.labels}>
                {ticks.map((meters) => {
                    return (
                        <Typography
                            key={meters}
                            variant="text-xs"
                            render={<span />}
                            className={s.label}
                            style={{ left: offsetOf(meters) }}
                        >
                            {unit === 'km' ? meters / SCALE_BAR_KM_THRESHOLD_M : meters}
                        </Typography>
                    );
                })}
            </div>
            <div ref={barRef} className={s.bar}>
                <div className={s.baseline} />
                {ticks.map((meters) => {
                    return <span key={meters} className={s.tick} style={{ left: offsetOf(meters) }} />;
                })}
            </div>
            <Typography render={<span />} variant="text-xs" className={s.unit}>
                {unit}
            </Typography>
        </div>
    );
};

/**
 * Live gate: mounted (and subscribed to the map) only at/above `SCALE_BAR_MIN_ZOOM`.
 * Below that the bar hides.
 */
export const ScaleBar: React.FC = () => {
    const enabled = useZoomAtLeast(SCALE_BAR_MIN_ZOOM);

    if (!enabled) return null;

    return <ScaleBarInner />;
};
