import type { ViewportSize } from '../hooks/useViewportSize';

/**
 * SVG path `d` for a screen-upright grid of `pitch`-pixel cells, aligned so that grid
 * lines fall on `anchorX`/`anchorY` (the center square's top-left edge). With `pitch`
 * equal to the square's on-screen size and the anchor at its edge, the cell straddling
 * the viewport center coincides exactly with the center square — every other cell is a
 * 100×100 m tile stepped out from it. Verticals span the full height, horizontals the
 * full width; the caller applies the radial fade mask.
 *
 * Cell size tracks zoom/latitude (it is `metersToPixels(100m, …)`), so this is rebuilt
 * every `render` frame by `useGridDriver` rather than only on resize.
 */
export const getGridLinesPath = (
    { width, height }: ViewportSize,
    pitch: number,
    anchorX: number,
    anchorY: number
): string => {
    if (width <= 0 || height <= 0 || pitch <= 0) return '';

    const segments: string[] = [];

    const colStart = Math.ceil((0 - anchorX) / pitch);
    const colEnd = Math.floor((width - anchorX) / pitch);
    for (let col = colStart; col <= colEnd; col++) {
        const x = anchorX + col * pitch;
        segments.push(`M${x} 0V${height}`);
    }

    const rowStart = Math.ceil((0 - anchorY) / pitch);
    const rowEnd = Math.floor((height - anchorY) / pitch);
    for (let row = rowStart; row <= rowEnd; row++) {
        const y = anchorY + row * pitch;
        segments.push(`M0 ${y}H${width}`);
    }

    return segments.join('');
};
