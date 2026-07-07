import { CENTER_SQUARE, INTERSECTION, PATIO_SQUARE, SQUARE_BORDER_WIDTH, SQUARE_CORNER_RADIUS } from '../../constants';
import { getRectAttrs } from '../../utils/squareGeometry';
import { useSelectPatioOnClick } from '../../hooks/useSelectPatioOnClick';
import { useSquares } from '../../hooks/useSquares';
import s from './styles.module.css';

type SquaresOverlayProps = {
    /**
     * Live map bearing, in degrees clockwise from north. The center square stays
     * screen-upright; existing patios counter-rotate by it (screen azimuth =
     * worldAzimuth − bearing) so they stay pinned to the world.
     */
    bearing: number;
};

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
export const SquaresOverlay: React.FC<SquaresOverlayProps> = ({ bearing }) => {
    useSelectPatioOnClick();

    const squares = useSquares(bearing);
    if (!squares) return null;

    const { camera, center, patios } = squares;
    const centerAttrs = getRectAttrs(center);

    return (
        <svg className={s.overlay} width={camera.width} height={camera.height}>
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
