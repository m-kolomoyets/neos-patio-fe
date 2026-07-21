import type { CSSProperties } from 'react';
import type { IndicatorType } from '../../types';
import {
    CENTER_SQUARE,
    CROSSFADE_BAND,
    GRID,
    INDICATOR_HOVER_GLOW_OPACITY,
    INDICATOR_PALETTE,
    INTERSECTION,
    SQUARE_BORDER_WIDTH,
    SQUARE_CORNER_RADIUS,
} from '../../constants';
import { getCrossfadeOpacity } from '../../utils/getCrossfadeOpacity';
import { useCreatePatioMode } from '../../context/CreatePatioContext';
import { useCrossfadeDriver } from '../../hooks/useCrossfadeDriver';
import { usePatioGeometries } from '../../hooks/usePatioGeometries';
import { useSelectPatioOnClick } from '../../hooks/useSelectPatioOnClick';
import { patioGeoId, useSquaresDriver } from '../../hooks/useSquaresDriver';
import { useSquareStates } from '../../hooks/useSquareStates';
import { useZoomAtLeast } from '../../hooks/useZoomAtLeast';
import { useViewportSize } from './hooks/useViewportSize';
import { GridPath } from './components/GridPath';
import s from './styles.module.css';

/** Custom property the cross-fade driver writes onto the overlay each frame. */
type CrossfadeVars = CSSProperties & { '--crossfade-opacity': string };

/** Pressed/selected ring color, read by `styles.module.css` per square. */
type IndicatorVars = CSSProperties & { '--indicator-pressed-border': string };

/** Every indicator type gets its own gradient + inner-glow filter, defined once. */
const INDICATOR_TYPES = Object.keys(INDICATOR_PALETTE) as IndicatorType[];

const indicatorGradientId = (type: IndicatorType) => {
    return `indicator-gradient-${type}`;
};

const indicatorInsetId = (type: IndicatorType) => {
    return `indicator-inset-${type}`;
};

/** Shared white wash the hovered treatment fades in over a square. */
const HOVER_WASH_ID = 'indicator-hover-wash';

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
    const registerState = useSquareStates(patios);
    const viewport = useViewportSize();
    // Placement chrome — grid, center square, intersection paint — belongs to create
    // mode only. Patio geometry is needed in both modes, so the driver and the
    // `center` entry stay unconditional; only the JSX below branches.
    const { mode } = useCreatePatioMode();
    const isCreate = mode === 'create';

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
                {/* One radial fill per indicator type (`target` is the center cursor). */}
                {INDICATOR_TYPES.map((type) => {
                    const palette = INDICATOR_PALETTE[type];

                    return (
                        <radialGradient key={type} id={indicatorGradientId(type)}>
                            <stop offset="0%" stopColor={palette.gradientEdge} stopOpacity={0} />
                            <stop
                                offset="100%"
                                stopColor={palette.gradientEdge}
                                stopOpacity={palette.gradientOpacity}
                            />
                        </radialGradient>
                    );
                })}
                {/* Hovered treatment: a white wash rising from the bottom of the square
                    (Figma), faded in by CSS on the overlay rect — never re-rendered. */}
                <radialGradient id={HOVER_WASH_ID} cx="50%" cy="90%" r="75%">
                    <stop offset="0%" stopColor="#fff" stopOpacity={INDICATOR_HOVER_GLOW_OPACITY} />
                    <stop offset="100%" stopColor="#fff" stopOpacity={0} />
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
                {/* Inner glow per indicator type — the ring the design draws inside each
                    square's edge. Same construction as the center square, one flood
                    color per palette entry. */}
                {INDICATOR_TYPES.map((type) => {
                    return (
                        <filter key={type} id={indicatorInsetId(type)}>
                            <feComponentTransfer in="SourceAlpha">
                                <feFuncA type="table" tableValues="1 0" />
                            </feComponentTransfer>
                            <feGaussianBlur stdDeviation={6} />
                            <feOffset result="offsetblur" />
                            <feFlood floodColor={INDICATOR_PALETTE[type].insetShadow} />
                            <feComposite in2="offsetblur" operator="in" />
                            <feComposite in2="SourceAlpha" operator="in" />
                            <feMerge>
                                <feMergeNode in="SourceGraphic" />
                                <feMergeNode />
                            </feMerge>
                        </filter>
                    );
                })}
                {isCreate && (
                    <clipPath id={centerClipId}>
                        <rect
                            ref={(el) => {
                                return registerRect('center-clip', 'center', el);
                            }}
                            rx={SQUARE_CORNER_RADIUS}
                        />
                    </clipPath>
                )}
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
            {/* Create-mode reference grid; mounts `useGridDriver` only in create mode. */}
            {isCreate && <GridPath />}
            {/* Patio squares (geo-anchored), colored by the indicator palette. Each
                carries a `data-state` written imperatively by `useSquareStates`, plus a
                white wash rect faded in on hover — both are plain CSS flips on nodes
                that are already mounted, so interaction never re-renders this tree. */}
            {patios.map(({ id, indicatorType }) => {
                const indicatorVars: IndicatorVars = {
                    '--indicator-pressed-border': INDICATOR_PALETTE[indicatorType].pressedBorder,
                };

                return (
                    <g key={id}>
                        <rect
                            className={s.square}
                            style={indicatorVars}
                            ref={(el) => {
                                registerRect(`patio-base-${id}`, patioGeoId(id), el);
                                registerState(`patio-base-${id}`, id, el);
                            }}
                            rx={SQUARE_CORNER_RADIUS}
                            strokeWidth={SQUARE_BORDER_WIDTH}
                            fill={`url(#${indicatorGradientId(indicatorType)})`}
                            filter={`url(#${indicatorInsetId(indicatorType)})`}
                        />
                        <rect
                            className={s['hover-wash']}
                            ref={(el) => {
                                registerRect(`patio-hover-${id}`, patioGeoId(id), el);
                                registerState(`patio-hover-${id}`, id, el);
                            }}
                            rx={SQUARE_CORNER_RADIUS}
                            fill={`url(#${HOVER_WASH_ID})`}
                        />
                    </g>
                );
            })}

            {/* Base orange center square (pinned to viewport), create mode only. */}
            {isCreate && (
                <rect
                    ref={(el) => {
                        return registerRect('center-base', 'center', el);
                    }}
                    rx={SQUARE_CORNER_RADIUS}
                    fill={`url(#${indicatorGradientId('target')})`}
                    stroke={CENTER_SQUARE.border}
                    strokeWidth={SQUARE_BORDER_WIDTH}
                    filter="url(#center-square-inset)"
                />
            )}

            {/* Red collision layer: one independent overlap per patio. Create mode only —
                it paints the center square against its neighbours. */}
            {isCreate &&
                patios.map(({ id }) => {
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
