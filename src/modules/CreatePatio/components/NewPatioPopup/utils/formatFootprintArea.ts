/** `10000` → `10 000 m2`, derived from the footprint rather than hardcoded. */
export const formatFootprintArea = (meters: number): string => {
    return `${(meters ** 2).toLocaleString('en-US').replaceAll(',', ' ')} m2`;
};
