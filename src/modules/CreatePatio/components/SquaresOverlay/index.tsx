import type { CSSProperties } from 'react';
import {
    CENTER_SQUARE,
    CROSSFADE_BAND,
    INTERSECTION,
    PATIO_SQUARE,
    SQUARE_BORDER_WIDTH,
    SQUARE_CORNER_RADIUS,
} from '../../constants';
import { getCrossfadeOpacity } from '../../utils/getCrossfadeOpacity';
import { getRectAttrs } from '../../utils/squareGeometry';
import { useCrossfadeDriver } from '../../hooks/useCrossfadeDriver';
import { useSelectPatioOnClick } from '../../hooks/useSelectPatioOnClick';
import { useSquares } from '../../hooks/useSquares';
import { useZoomAtLeast } from '../../hooks/useZoomAtLeast';
import s from './styles.module.css';

/** Custom property the cross-fade driver writes onto the overlay each frame. */
type CrossfadeVars = CSSProperties & { '--crossfade-opacity': string };

/** Stable registry key for the single placement-layer overlay element. */
const OVERLAY_KEY = 'squares-overlay';

const centerClipId = 'center-clip';
const patioClipId = (id: string) => {
    return `patio-clip-${id}`;
};

/**
 * The full square overlay: blue patio squares, the orange center square, and the
 * live red collision layer. Collisions are computed with SVG `clipPath` rather
 * than boolean geometry — for each patio, a red copy of the center clipped to the
 * patio paints the overlap, and each square's stroke clipped to the other paints
 * the red border-inside segments. Rounded corners are exact because the browser
 * does the clipping. Only center-vs-patio overlaps are drawn.
 */
export const SquaresOverlay: React.FC = () => {
    useSelectPatioOnClick();

    const registerCrossfade = useCrossfadeDriver();
    // Mount from the bottom of the cross-fade band (below the placement threshold)
    // so the squares can fade in against the outgoing browse markers. Placement
    // *interactions* stay gated at `PLACEMENT_MIN_ZOOM` inside `useSelectPatioOnClick`
    // and the overlay is `pointer-events: none`, so rendering early is purely visual.
    const visible = useZoomAtLeast(CROSSFADE_BAND.min);
    const squares = useSquares();
    if (!squares) return null;
    if (!visible) return null;

    const { camera, center, patios } = squares;

    // Seed the driver's opacity from the current zoom so the first paint is already
    // at the right cross-fade value (no full-opacity flash on mount); the driver
    // then updates `--crossfade-opacity` every frame.
    const crossfadeVars: CrossfadeVars = { '--crossfade-opacity': `${getCrossfadeOpacity(camera.zoom, 'placement')}` };

    const centerAttrs = getRectAttrs(center);

    return (
        <svg
            className={s.overlay}
            width={camera.width}
            height={camera.height}
            style={crossfadeVars}
            ref={(el) => {
                registerCrossfade(OVERLAY_KEY, el ? { el, layer: 'placement' } : null);
            }}
        >
            <defs>
                <radialGradient id="center-square-gradient">
                    <stop offset="0%" stopColor={CENTER_SQUARE.gradientEdge} stopOpacity={0} />
                    <stop
                        offset="100%"
                        stopColor={CENTER_SQUARE.gradientEdge}
                        stopOpacity={CENTER_SQUARE.gradientOpacity}
                    />
                </radialGradient>
                <radialGradient id="patio-square-gradient">
                    <stop offset="0%" stopColor={PATIO_SQUARE.gradientEdge} stopOpacity={0} />
                    <stop
                        offset="100%"
                        stopColor={PATIO_SQUARE.gradientEdge}
                        stopOpacity={PATIO_SQUARE.gradientOpacity}
                    />
                </radialGradient>
                <filter id="center-square-inset">
                    <feComponentTransfer in="SourceAlpha">
                        <feFuncA type="table" tableValues="1 0" />
                    </feComponentTransfer>
                    <feGaussianBlur stdDeviation={4} />
                    <feOffset result="offsetblur" />
                    <feFlood floodColor={CENTER_SQUARE.insetShadow} />
                    <feComposite in2="offsetblur" operator="in" />
                    <feComposite in2="SourceAlpha" operator="in" />
                    <feMerge>
                        <feMergeNode in="SourceGraphic" />
                        <feMergeNode />
                    </feMerge>
                </filter>
                <filter id="patio-square-inset">
                    <feComponentTransfer in="SourceAlpha">
                        <feFuncA type="table" tableValues="1 0" />
                    </feComponentTransfer>
                    <feGaussianBlur stdDeviation={6} />
                    <feOffset result="offsetblur" />
                    <feFlood floodColor={PATIO_SQUARE.insetShadow} />
                    <feComposite in2="offsetblur" operator="in" />
                    <feComposite in2="SourceAlpha" operator="in" />
                    <feMerge>
                        <feMergeNode in="SourceGraphic" />
                        <feMergeNode />
                    </feMerge>
                </filter>

                <clipPath id={centerClipId}>
                    <rect {...centerAttrs} rx={SQUARE_CORNER_RADIUS} />
                </clipPath>
                {patios.map(({ id, rect }) => {
                    return (
                        <clipPath key={id} id={patioClipId(id)}>
                            <rect {...getRectAttrs(rect)} rx={SQUARE_CORNER_RADIUS} />
                        </clipPath>
                    );
                })}
            </defs>

            {/* Base blue patio squares (geo-anchored). */}
            {patios.map(({ id, rect }) => {
                return (
                    <rect
                        key={id}
                        {...getRectAttrs(rect)}
                        rx={SQUARE_CORNER_RADIUS}
                        fill="url(#patio-square-gradient)"
                        stroke={PATIO_SQUARE.border}
                        strokeWidth={SQUARE_BORDER_WIDTH}
                        filter="url(#patio-square-inset)"
                    />
                );
            })}

            {/* Base orange center square (pinned to viewport). */}
            <rect
                {...centerAttrs}
                rx={SQUARE_CORNER_RADIUS}
                fill="url(#center-square-gradient)"
                stroke={CENTER_SQUARE.border}
                strokeWidth={SQUARE_BORDER_WIDTH}
                filter="url(#center-square-inset)"
            />

            {/* Red collision layer: one independent overlap per patio. */}
            {patios.map(({ id, rect }) => {
                const patioAttrs = getRectAttrs(rect);
                const clipToPatio = `url(#${patioClipId(id)})`;
                const clipToCenter = `url(#${centerClipId})`;

                // clip-path (userSpaceOnUse) is applied in the user space of the
                // element it sits on — including that element's own transform. So
                // the clip-path must live on a non-transformed wrapper <g>, never
                // on the rotated rect, or the clip geometry gets double-rotated.
                return (
                    <g key={id}>
                        {/* Overlap region: center filled red, clipped to the patio. */}
                        <g clipPath={clipToPatio}>
                            <rect
                                {...centerAttrs}
                                rx={SQUARE_CORNER_RADIUS}
                                fill={INTERSECTION.fill}
                                fillOpacity={INTERSECTION.fillOpacity}
                            />
                        </g>
                        {/* Center border segments inside the patio. */}
                        <g clipPath={clipToPatio}>
                            <rect
                                {...centerAttrs}
                                rx={SQUARE_CORNER_RADIUS}
                                fill="none"
                                stroke={INTERSECTION.border}
                                strokeWidth={SQUARE_BORDER_WIDTH}
                            />
                        </g>
                        {/* Patio border segments inside the center. */}
                        <g clipPath={clipToCenter}>
                            <rect
                                {...patioAttrs}
                                rx={SQUARE_CORNER_RADIUS}
                                fill="none"
                                stroke={INTERSECTION.border}
                                strokeWidth={SQUARE_BORDER_WIDTH}
                            />
                        </g>
                    </g>
                );
            })}
        </svg>
    );
};
