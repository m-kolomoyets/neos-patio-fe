import type { IndicatorType } from '@/modules/CreatePatio/types';

export const indicatorGradientId = (type: IndicatorType) => {
    return `indicator-gradient-${type}`;
};

export const indicatorInsetId = (type: IndicatorType) => {
    return `indicator-inset-${type}`;
};

/** Same glow, minus the white highlights — the selected/pressed treatment. */
export const indicatorInsetPressedId = (type: IndicatorType) => {
    return `${indicatorInsetId(type)}-pressed`;
};

/** The 222.5° accent sheen laid over the square, one ramp per indicator type. */
export const indicatorSheenId = (type: IndicatorType) => {
    return `indicator-sheen-${type}`;
};
