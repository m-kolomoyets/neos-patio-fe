const KILOBYTE = 1024;
const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

/** Human-readable file size, e.g. `12.4 MB`. */
export const formatFileSize = (bytes: number): string => {
    if (bytes <= 0) {
        return '0 B';
    }

    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(KILOBYTE)), UNITS.length - 1);
    const value = bytes / KILOBYTE ** exponent;

    return `${value.toFixed(exponent === 0 ? 0 : 1)} ${UNITS[exponent]}`;
};
