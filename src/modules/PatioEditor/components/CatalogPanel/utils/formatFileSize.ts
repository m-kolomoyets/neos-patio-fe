const BYTES_PER_MB = 1024 * 1024;

/**
 * Renders a raw byte count as a megabyte label for the asset preview, e.g.
 * `9_146_368 → "9 MB"`. Rounds to a whole number; sub-MB sizes show one decimal
 * so tiny assets don't collapse to `0 MB`.
 */
export const formatFileSize = (bytes: number): string => {
    const mb = bytes / BYTES_PER_MB;
    const value = mb >= 1 ? Math.round(mb) : Math.round(mb * 10) / 10;
    return `${value} MB`;
};
