import type { CSSProperties } from 'react';
import {
    CENTER_SQUARE,
    CROSSFADE_BAND,
    GRID,
    INTERSECTION,
    PATIO_SQUARE,
    SQUARE_BORDER_WIDTH,
    SQUARE_CORNER_RADIUS,
} from '../../constants';
import { getCrossfadeOpacity } from '../../utils/getCrossfadeOpacity';
import { useCrossfadeDriver } from '../../hooks/useCrossfadeDriver';
import { usePatioGeometries } from '../../hooks/usePatioGeometries';
import { useSelectPatioOnClick } from '../../hooks/useSelectPatioOnClick';
import { patioGeoId, useSquaresDriver } from '../../hooks/useSquaresDriver';
import { useZoomAtLeast } from '../../hooks/useZoomAtLeast';
import { useGridDriver } from './hooks/useGridDriver';
import { useViewportSize } from './hooks/useViewportSize';
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
 *
 * The tree here is *structural only* — one keyed node set per patio, re-rendered
 * only when the patio list or visibility changes. Every rect's pixel position is
 * written imperatively by `useSquaresDriver` on the map's `render` event (via the
 * registered refs), so panning/zooming never re-renders React and the overlay
 * tracks the GL canvas without swimming. Rects that mirror the same geometry
 * (base, clip, and intersection copies) register under the same geo id.
 */
export const SquaresOverlay: React.FC = () => {
    useSelectPatioOnClick();

    const registerCrossfade = useCrossfadeDriver();
    const patios = usePatioGeometries();
    const registerRect = useSquaresDriver(patios);
    const registerGrid = useGridDriver();
    const viewport = useViewportSize();

    // Mount from the bottom of the cross-fade band (below the placement threshold)
    // so the squares can fade in against the outgoing browse markers. Placement
    // *interactions* stay gated at `PLACEMENT_MIN_ZOOM` inside `useSelectPatioOnClick`
    // and the overlay is `pointer-events: none`, so rendering early is purely visual.
    const visible = useZoomAtLeast(CROSSFADE_BAND.min);
    if (!visible) return null;

    // Seed the driver's opacity from the current zoom so the first paint is already
    // at the right cross-fade value (no full-opacity flash on mount); the driver
    // then updates `--crossfade-opacity` every frame. Positions are seeded by
    // `useSquaresDriver`'s layout-effect paint before the browser first paints.
    const crossfadeVars: CrossfadeVars = {
        '--crossfade-opacity': `${getCrossfadeOpacity(CROSSFADE_BAND.min, 'placement')}`,
    };

    return (
        <svg
            className={s.overlay}
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
                {/* Radial fade for the reference grid: opaque core centered on the
                    viewport, transparent by `fadeEnd`. `userSpaceOnUse` + a scale to
                    (½w, ½h) makes r=1 an ellipse reaching the mid-edges, so the fade
                    stays proportional at any viewport size (matching Figma Group 29). */}
                <radialGradient
                    id="grid-fade-gradient"
                    gradientUnits="userSpaceOnUse"
                    cx={0}
                    cy={0}
                    r={1}
                    gradientTransform={`translate(${viewport.width / 2} ${viewport.height / 2}) scale(${viewport.width / 2} ${viewport.height / 2})`}
                >
                    <stop offset={GRID.fadeStart} stopColor="#fff" stopOpacity={1} />
                    <stop offset={GRID.fadeEnd} stopColor="#fff" stopOpacity={0} />
                </radialGradient>
                <mask id="grid-fade" maskUnits="userSpaceOnUse">
                    <rect width={viewport.width} height={viewport.height} fill="url(#grid-fade-gradient)" />
                </mask>
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
                    <rect
                        ref={(el) => {
                            return registerRect('center-clip', 'center', el);
                        }}
                        rx={SQUARE_CORNER_RADIUS}
                    />
                </clipPath>
                {patios.map(({ id }) => {
                    return (
                        <clipPath key={id} id={patioClipId(id)}>
                            <rect
                                ref={(el) => {
                                    return registerRect(`patio-clip-${id}`, patioGeoId(id), el);
                                }}
                                rx={SQUARE_CORNER_RADIUS}
                            />
                        </clipPath>
                    );
                })}
            </defs>
            {/* Reference grid of 100×100 m cells (center cell = the center square),
                radially faded toward the viewport edges. Painted first so every square
                sits on top of it; inherits the svg's `--crossfade-opacity`, so it fades
                in/out with the squares. Its `d` is written per frame by `useGridDriver`. */}
            <path
                ref={registerGrid}
                fill="none"
                stroke={GRID.lineColor}
                strokeWidth={GRID.lineWidth}
                strokeOpacity={GRID.opacity}
                mask="url(#grid-fade)"
            />
            {/* Base blue patio squares (geo-anchored). */}
            {patios.map(({ id }) => {
                return (
                    <rect
                        key={id}
                        ref={(el) => {
                            return registerRect(`patio-base-${id}`, patioGeoId(id), el);
                        }}
                        rx={SQUARE_CORNER_RADIUS}
                        fill="url(#patio-square-gradient)"
                        filter="url(#patio-square-inset)"
                    />
                );
            })}

            {/* Base orange center square (pinned to viewport). */}
            <rect
                ref={(el) => {
                    return registerRect('center-base', 'center', el);
                }}
                rx={SQUARE_CORNER_RADIUS}
                fill="url(#center-square-gradient)"
                stroke={CENTER_SQUARE.border}
                strokeWidth={SQUARE_BORDER_WIDTH}
                filter="url(#center-square-inset)"
            />

            {/* Red collision layer: one independent overlap per patio. */}
            {patios.map(({ id }) => {
                const clipToPatio = `url(#${patioClipId(id)})`;

                // clip-path (userSpaceOnUse) is applied in the user space of the
                // element it sits on — including that element's own transform. So
                // the clip-path must live on a non-transformed wrapper <g>, never
                // on the rotated rect, or the clip geometry gets double-rotated.
                return (
                    <g key={id}>
                        {/* Overlap region: center filled red, clipped to the patio. */}
                        <g clipPath={clipToPatio}>
                            <rect
                                ref={(el) => {
                                    return registerRect(`x-fill-${id}`, 'center', el);
                                }}
                                rx={SQUARE_CORNER_RADIUS}
                                fill={INTERSECTION.fill}
                                fillOpacity={INTERSECTION.fillOpacity}
                            />
                        </g>
                        {/* Center border segments inside the patio. */}
                        <g clipPath={clipToPatio}>
                            <rect
                                ref={(el) => {
                                    return registerRect(`x-center-border-${id}`, 'center', el);
                                }}
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
