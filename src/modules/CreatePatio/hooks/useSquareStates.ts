import type { IndicatorState, Point } from '../types';
import type { PatioGeometry } from './usePatioGeometries';
import { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID } from '../constants';
import { findPatioAtPoint } from '../utils/findPatioAtPoint';
import { useCreatePatioMode } from '../context/CreatePatioContext';

/** Registers a state-carrying element under a stable key; `null` unregisters it. */
export type RegisterStateTarget = (_key: string, _patioId: string, _el: SVGElement | null) => void;

/**
 * Resolves one patio's indicator state. There is no `selected` variant in the
 * design system, so selection reuses the pressed visual and is sticky.
 * Precedence: `selected` > `pressed` > `hovered` > `default`.
 */
const resolveState = (
    patioId: string,
    selectedId: string | null,
    pressedId: string | null,
    hoveredId: string | null
): IndicatorState => {
    if (patioId === selectedId || patioId === pressedId) return 'pressed';
    if (patioId === hoveredId) return 'hovered';

    return 'default';
};

/**
 * Paints hover / press / selected onto the patio squares **imperatively** — the
 * same posture as `useSquaresDriver`: the map's own pointer events feed the shared
 * `findPatioAtPoint` hit-test (the overlay is `pointer-events: none`, so the SVG
 * never receives pointer events itself) and the result is written straight to each
 * rect's `data-state`. No React state, so hovering never re-renders the overlay.
 *
 * Hover is re-resolved on a `requestAnimationFrame` gate, fed both by `mousemove`
 * and by the map's `render` frames — the square can slide under a stationary
 * cursor while the camera moves, and the pointer can move while the camera is idle.
 */
export const useSquareStates = (patios: PatioGeometry[]): RegisterStateTarget => {
    const maps = useMap();
    const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];
    const { selectedPatioId } = useCreatePatioMode();

    // key → the element and the patio whose state it mirrors (base rect, hover wash).
    const targetsRef = useRef(new Map<string, { patioId: string; el: SVGElement }>());
    const hoveredRef = useRef<string | null>(null);
    const pressedRef = useRef<string | null>(null);
    // Read live inside the pointer/frame handlers without re-subscribing on change.
    const patiosRef = useRef(patios);
    const selectedRef = useRef(selectedPatioId);
    // Exposed so a selection change (or a fresh mount) can repaint while idle.
    const applyRef = useRef<(() => void) | null>(null);

    const register = useCallback<RegisterStateTarget>((key, patioId, el) => {
        if (el) {
            targetsRef.current.set(key, { patioId, el });
            // Newly mounted rects must not flash the default state if they are
            // already selected/hovered.
            el.setAttribute(
                'data-state',
                resolveState(patioId, selectedRef.current, pressedRef.current, hoveredRef.current)
            );
        } else {
            targetsRef.current.delete(key);
        }
    }, []);

    useEffect(
        function subscribeToPointer() {
            const map = mapRef?.getMap();
            if (!map) return;

            const canvas = map.getCanvas();
            let lastPoint: Point | null = null;
            let frame: number | null = null;

            const apply = () => {
                for (const { patioId, el } of targetsRef.current.values()) {
                    el.setAttribute(
                        'data-state',
                        resolveState(patioId, selectedRef.current, pressedRef.current, hoveredRef.current)
                    );
                }
            };

            const resolveHover = () => {
                frame = null;
                const hit = lastPoint ? findPatioAtPoint(map, patiosRef.current, lastPoint) : undefined;
                const nextHovered = hit?.id ?? null;
                canvas.style.cursor = nextHovered ? 'pointer' : '';
                if (nextHovered === hoveredRef.current) return;

                hoveredRef.current = nextHovered;
                apply();
            };

            const scheduleHover = () => {
                if (frame !== null) return;
                frame = requestAnimationFrame(resolveHover);
            };

            const handleMouseMove = (event: mapboxgl.MapMouseEvent) => {
                lastPoint = { x: event.point.x, y: event.point.y };
                scheduleHover();
            };

            const handleMouseOut = () => {
                lastPoint = null;
                canvas.style.cursor = '';
                if (!hoveredRef.current) return;

                hoveredRef.current = null;
                apply();
            };

            const handleMouseDown = (event: mapboxgl.MapMouseEvent) => {
                const hit = findPatioAtPoint(map, patiosRef.current, { x: event.point.x, y: event.point.y });
                pressedRef.current = hit?.id ?? null;
                if (pressedRef.current) apply();
            };

            // Released anywhere (including outside the canvas after a drag), so the
            // press never sticks — selection is what stays, and it is separate state.
            const handlePointerUp = () => {
                if (!pressedRef.current) return;

                pressedRef.current = null;
                apply();
            };

            applyRef.current = apply;
            apply();
            map.on('mousemove', handleMouseMove);
            map.on('mouseout', handleMouseOut);
            map.on('mousedown', handleMouseDown);
            map.on('render', scheduleHover);
            window.addEventListener('pointerup', handlePointerUp);

            return () => {
                if (frame !== null) cancelAnimationFrame(frame);
                canvas.style.cursor = '';
                applyRef.current = null;
                map.off('mousemove', handleMouseMove);
                map.off('mouseout', handleMouseOut);
                map.off('mousedown', handleMouseDown);
                map.off('render', scheduleHover);
                window.removeEventListener('pointerup', handlePointerUp);
            };
        },
        [mapRef]
    );

    useEffect(
        function repaintOnData() {
            patiosRef.current = patios;
            selectedRef.current = selectedPatioId;
            applyRef.current?.();
        },
        [patios, selectedPatioId]
    );

    return register;
};
