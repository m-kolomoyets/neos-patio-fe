import { useEffect } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID } from '../constants';
import { findPatioAtPoint } from '../utils/findPatioAtPoint';
import { flyToView } from '../utils/flyToView';
import { useCreatePatioMode } from '../context/CreatePatioContext';
import { usePatioGeometries } from './usePatioGeometries';

/**
 * Subscribes to the map `click` event and hit-tests the click against every
 * existing patio square (`findPatioAtPoint`, the same test that drives hover). A
 * hit selects that patio, opening the details popup, and — because clicking a
 * neighbour should never fight with placing — always drops the screen back to
 * `view` mode. A miss clears the selection and closes the popup.
 *
 * The camera follows the selection **only from view mode**: a click made while
 * placing was aimed at something, so switching modes must not also yank the view.
 * The flight keeps the current zoom — the square is already on screen (the
 * hit-test is gated at `PLACEMENT_MIN_ZOOM`), so it only needs centering.
 */
export const useSelectPatioOnClick = (): void => {
    const maps = useMap();
    const { mode, selectPatio } = useCreatePatioMode();
    // Same relocated fixture set the squares render, so a geo hit-test selects a
    // real patio id (the DOM singleton path uses the same ids).
    const patios = usePatioGeometries();
    useEffect(
        function subscribeToClick() {
            const mapRef = maps.current ?? maps[CREATE_PATIO_MAP_ID];
            const map = mapRef?.getMap();
            if (!map) return;

            const handleClick = (event: mapboxgl.MapMouseEvent) => {
                // Badge taps bubble out of the DOM markers into the map's own click
                // event. They own their selection (and are the only path available
                // below the square gate), so a marker click must never be read as a
                // miss — that would clear the selection the badge just made.
                const target = event.originalEvent.target;
                if (target instanceof Element && target.closest('.mapboxgl-marker')) return;

                const hit = findPatioAtPoint(map, patios, { x: event.point.x, y: event.point.y });
                if (!hit) {
                    selectPatio(null);
                    return;
                }

                const shouldFly = mode === 'view';
                selectPatio(hit.id);
                if (shouldFly) {
                    flyToView(map, [hit.longitude, hit.latitude]);
                }
            };

            map.on('click', handleClick);

            return () => {
                map.off('click', handleClick);
            };
        },
        [maps, mode, patios, selectPatio]
    );
};
