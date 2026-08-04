import type { IndicatorVars, InnerShadowProps, OverlayVars } from './types';
import { Fragment } from 'react';
import {
    CENTER_SQUARE,
    CROSSFADE_BAND,
    GRID,
    INDICATOR_FILL_MID,
    INDICATOR_HIGHLIGHTS,
    INDICATOR_HOVER_GLOW_OPACITY,
    INDICATOR_PALETTE,
    INDICATOR_SHEEN,
    INTERSECTION,
    SQUARE_BORDER_WIDTH,
    SQUARE_CORNER_RADIUS,
} from '../../constants';
import { INDICATOR_TYPES, SHAPE_RESULT } from './constants';
import { getCrossfadeOpacity } from '../../utils/getCrossfadeOpacity';
import { indicatorGradientId, indicatorInsetId, indicatorInsetPressedId, indicatorSheenId } from './utils/indicators';
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

/**
 * One CSS-`inset`-equivalent shadow as filter primitives: spread the silhouette,
 * invert it to get the "outside" mask, blur it, offset it (same sign convention as
 * `box-shadow`), paint it, then clip back to the silhouette. Composed into the
 * indicator filters below, once for the colored glow and once per white highlight.
 */
const InnerShadow: React.FC<InnerShadowProps> = ({ color, blur, dx = 0, dy = 0, spread = 0, result }) => {
    // A negative inset spread widens the hole (dilate); a positive one shrinks it.
    const spreadResult = spread === 0 ? SHAPE_RESULT : `${result}-spread`;

    return (
        <>
            {spread !== 0 && (
                <feMorphology
                    in={SHAPE_RESULT}
                    operator={spread < 0 ? 'dilate' : 'erode'}
                    radius={Math.abs(spread)}
                    result={spreadResult}
                />
            )}
            <feComponentTransfer in={spreadResult} result={`${result}-inverted`}>
                <feFuncA type="table" tableValues="1 0" />
            </feComponentTransfer>
            <feGaussianBlur in={`${result}-inverted`} stdDeviation={blur / 2} result={`${result}-blurred`} />
            <feOffset in={`${result}-blurred`} dx={dx} dy={dy} result={`${result}-offset`} />
            <feFlood floodColor={color} result={`${result}-flood`} />
            <feComposite in={`${result}-flood`} in2={`${result}-offset`} operator="in" result={`${result}-painted`} />
            <feComposite in={`${result}-painted`} in2={SHAPE_RESULT} operator="in" result={result} />
        </>
    );
};

/** Saturates the square's alpha into the solid silhouette every shadow masks off. */
const ShapeMask: React.FC = () => {
    return (
        <feComponentTransfer in="SourceAlpha" result={SHAPE_RESULT}>
            <feFuncA type="linear" slope={255} />
        </feComponentTransfer>
    );
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
    const overlayVars: OverlayVars = {
        '--crossfade-opacity': `${getCrossfadeOpacity(CROSSFADE_BAND.min, 'placement')}`,
        '--indicator-sheen-rest': `${INDICATOR_SHEEN.restOpacity}`,
    };

    return (
        <svg
            className={s.overlay}
            style={overlayVars}
            ref={(el) => {
                registerCrossfade(OVERLAY_KEY, el ? { el, layer: 'placement' } : null);
            }}
        >
            <defs>
                {/* One radial fill per indicator type (`target` is the center cursor).
                    The mid stop holds the ramp back so most of the fade happens in the
                    outer third — a clear center, a dense edge, as in the design. */}
                {INDICATOR_TYPES.map((type) => {
                    const palette = INDICATOR_PALETTE[type];

                    return (
                        <radialGradient key={type} id={indicatorGradientId(type)}>
                            <stop offset="0%" stopColor={palette.gradientEdge} stopOpacity={0} />
                            <stop
                                offset={`${INDICATOR_FILL_MID.offset * 100}%`}
                                stopColor={palette.gradientEdge}
                                stopOpacity={palette.gradientOpacity * INDICATOR_FILL_MID.opacityRatio}
                            />
                            <stop
                                offset="100%"
                                stopColor={palette.gradientEdge}
                                stopOpacity={palette.gradientOpacity}
                            />
                        </radialGradient>
                    );
                })}
                {/* Accent sheen per type — 222.5° in Figma, i.e. top-right → bottom-left,
                    bright at both ends and near-zero across the middle. Painted at the
                    pressed alphas here; CSS scales the rect down for the other states. */}
                {INDICATOR_TYPES.map((type) => {
                    const palette = INDICATOR_PALETTE[type];

                    return (
                        <linearGradient key={type} id={indicatorSheenId(type)} x1="1" y1="0" x2="0" y2="1">
                            {INDICATOR_SHEEN.stops.map((stop) => {
                                return (
                                    <stop
                                        key={stop.offset}
                                        offset={stop.offset}
                                        stopColor={palette.gradientEdge}
                                        stopOpacity={stop.opacity}
                                    />
                                );
                            })}
                        </linearGradient>
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
                    square's edge — in two flavours: with the white highlights on top
                    (default / hovered) and without (selected, which adds an accent ring
                    instead). CSS picks between them off `data-state`. */}
                {INDICATOR_TYPES.map((type) => {
                    return (
                        <Fragment key={type}>
                            <filter id={indicatorInsetId(type)}>
                                <ShapeMask />
                                <InnerShadow color={INDICATOR_PALETTE[type].insetShadow} blur={12} result="glow" />
                                {INDICATOR_HIGHLIGHTS.map((highlight, index) => {
                                    return (
                                        <InnerShadow
                                            key={highlight.color}
                                            color={highlight.color}
                                            blur={highlight.blur}
                                            dx={highlight.dx}
                                            dy={highlight.dy}
                                            spread={highlight.spread}
                                            result={`highlight-${index}`}
                                        />
                                    );
                                })}
                                <feMerge>
                                    <feMergeNode in="SourceGraphic" />
                                    <feMergeNode in="glow" />
                                    {INDICATOR_HIGHLIGHTS.map((highlight, index) => {
                                        return <feMergeNode key={highlight.color} in={`highlight-${index}`} />;
                                    })}
                                </feMerge>
                            </filter>
                            <filter id={indicatorInsetPressedId(type)}>
                                <ShapeMask />
                                <InnerShadow color={INDICATOR_PALETTE[type].insetShadow} blur={12} result="glow" />
                                <feMerge>
                                    <feMergeNode in="SourceGraphic" />
                                    <feMergeNode in="glow" />
                                </feMerge>
                            </filter>
                        </Fragment>
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
                    '--indicator-inset': `url(#${indicatorInsetId(indicatorType)})`,
                    '--indicator-inset-pressed': `url(#${indicatorInsetPressedId(indicatorType)})`,
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
                        />
                        <rect
                            className={s.sheen}
                            ref={(el) => {
                                registerRect(`patio-sheen-${id}`, patioGeoId(id), el);
                                registerState(`patio-sheen-${id}`, id, el);
                            }}
                            rx={SQUARE_CORNER_RADIUS}
                            fill={`url(#${indicatorSheenId(indicatorType)})`}
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
