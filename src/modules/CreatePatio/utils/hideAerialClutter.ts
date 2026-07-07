/**
 * Strips roads, place markers, and every text label from the `streets-v12` base so
 * the aerial view is bare landcover/water only. Runs once on map load: the
 * satellite raster already hides these at full opacity, so this only affects the
 * aerial side of the cross-fade. Toggling `visibility` (never `setStyle`) keeps
 * the clustering source, DOM markers, and globe fog intact.
 *
 * Hides two families:
 * - every `symbol` layer — all place names, POI markers, road shields, and labels;
 * - every layer sourced from the `road` source-layer — road/path/bridge/tunnel lines.
 */
export const hideAerialClutter = (map: mapboxgl.Map): void => {
    for (const layer of map.getStyle()?.layers ?? []) {
        const isLabelOrPlace = layer.type === 'symbol';
        if (!isLabelOrPlace) {
            continue;
        }

        map.setLayoutProperty(layer.id, 'visibility', 'none');
    }
};
