import type { MapView } from '../../types';
import { useMap } from 'react-map-gl/mapbox';
import { Tabs } from '@/components/ui/Tabs';
import { CREATE_PATIO_MAP_ID, SATELLITE_RASTER_LAYER_ID } from '../../constants';
import { VIEWS } from './constants';
import { useMapView } from '../../hooks/useMapView';
import s from './styles.module.css';

/**
 * Top-center overlay switching the base map between satellite and aerial. Applies
 * the change imperatively — flips the satellite raster's opacity via
 * `setPaintProperty`, letting Mapbox's `raster-opacity-transition` cross-fade it —
 * so nothing in the map subtree re-renders and the clustering source, DOM markers,
 * and globe fog are untouched. Local choice is persisted to localStorage.
 */
export const MapViewTabs: React.FC = () => {
    const maps = useMap();
    const [view, setView] = useMapView();

    const applyView = (next: MapView) => {
        setView(next);

        const map = (maps.current ?? maps[CREATE_PATIO_MAP_ID])?.getMap();
        // Layer is absent until the style finishes loading; the initial paint
        // already reflects the persisted view, so skipping an early toggle is safe.
        if (!map || !map.getLayer(SATELLITE_RASTER_LAYER_ID)) return;

        map.setPaintProperty(SATELLITE_RASTER_LAYER_ID, 'raster-opacity', next === 'satellite' ? 1 : 0);
    };

    return (
        <div className={s.wrap}>
            <Tabs.Root
                value={view}
                onValueChange={(value) => {
                    applyView(value as MapView);
                }}
            >
                <Tabs.List>
                    {VIEWS.map((v) => {
                        return (
                            <Tabs.Tab key={v.value} value={v.value}>
                                {v.label}
                            </Tabs.Tab>
                        );
                    })}
                    <Tabs.Indicator />
                </Tabs.List>
            </Tabs.Root>
        </div>
    );
};
