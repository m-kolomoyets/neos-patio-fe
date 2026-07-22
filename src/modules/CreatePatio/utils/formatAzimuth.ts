/** `34.2` → `+34º`, `-3` → `−3º`; the design always carries the sign. */
export const formatAzimuth = (azimuthDeg: number): string => {
    return `${azimuthDeg >= 0 ? '+' : '−'}${Math.abs(Math.round(azimuthDeg))}º`;
};
