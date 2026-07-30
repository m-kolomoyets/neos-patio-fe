import type { Map as MapboxMap } from 'mapbox-gl';
import { useMap } from 'react-map-gl/mapbox';
import { CREATE_PATIO_MAP_ID } from '../constants';

/**
 * Single source of truth for the underlying Mapbox map instance. Wraps the
 * established access pattern: `current` is set inside the `<Map>` subtree, and
 * the registry id resolves it from outside (e.g. sibling overlays like the
 * control bar). Returns `undefined` until the map has mounted.
 */
export const useCreatePatioMap = (): MapboxMap | undefined => {
    const maps = useMap();
    return (maps.current ?? maps[CREATE_PATIO_MAP_ID])?.getMap();
};
