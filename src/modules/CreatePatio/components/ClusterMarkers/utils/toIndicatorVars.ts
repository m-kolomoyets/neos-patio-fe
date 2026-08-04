import type { IndicatorType } from '../../../types';
import type { IndicatorVars } from '../types';
import { INDICATOR_PALETTE } from '../../../constants';

/**
 * Badge colors for one indicator type. Singleton badges use the full four-color
 * palette (the same entries the SVG squares use) so the badge→square morph across
 * `MORPH_BAND` is a pure shape change; clusters pass only the two aggregate
 * colors — `owned` (green) when everything inside is published, `not-published`
 * (blue) otherwise.
 */
export const toIndicatorVars = (type: IndicatorType): IndicatorVars => {
    const palette = INDICATOR_PALETTE[type];

    return {
        '--indicator-fill': palette.badgeFill,
        '--indicator-glow': palette.insetShadow,
    };
};
