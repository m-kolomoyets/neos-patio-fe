import clsx from 'clsx';
import { Typography } from '@/components/ui/Typography';
import { SCALE_BAR_MIN_ZOOM, SCALE_BAR_SEGMENTS } from './constants';
import { useZoomAtLeast } from '../../hooks/useZoomAtLeast';
import { useScaleBarDriver } from './hooks/useScaleBarDriver';
import s from './styles.module.css';

/**
 * Top-down scale bar for the create map. Fixed 4 segments; labels are the exact
 * meters of a 1-2-5 rung (`0 · step … 4 · step`) with an `m` unit, and the bar
 * width flexes so those labels stay honest. Width is driven per-frame via a CSS
 * var; only the labels/theme re-render, and only on a rung / base-map crossing.
 */
const ScaleBarInner: React.FC = () => {
    const { wrapRef, step, variant } = useScaleBarDriver();
    const labels = Array.from({ length: SCALE_BAR_SEGMENTS + 1 }, (_, index) => {
        return step * index;
    });

    return (
        <div ref={wrapRef} className={clsx(s.wrap, step === 0 && s.hidden)} data-variant={variant} aria-hidden="true">
            <div className={s.labels}>
                {labels.map((value, index) => {
                    return (
                        <Typography
                            key={index}
                            variant="text-xs"
                            render={<span />}
                            className={s.label}
                            style={{ left: `${(index / SCALE_BAR_SEGMENTS) * 100}%` }}
                        >
                            {value}
                        </Typography>
                    );
                })}
            </div>
            <div>
                <div className={s.bar}>
                    <div className={s.baseline} />
                    <div className={s.ticks}>
                        {labels.map((_, index) => {
                            return (
                                <span
                                    key={index}
                                    className={s.tick}
                                    style={{ left: `${(index / SCALE_BAR_SEGMENTS) * 100}%` }}
                                />
                            );
                        })}
                    </div>
                </div>
                <Typography render={<span />} variant="text-xs" className={s.unit}>
                    m
                </Typography>
            </div>
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
