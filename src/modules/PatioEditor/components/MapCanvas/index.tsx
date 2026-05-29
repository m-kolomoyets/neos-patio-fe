import type { ViewStateChangeEvent } from 'react-map-gl/maplibre';
import type { PatioBounds } from '@/services/patios/types';
import { useCallback, useContext, useMemo } from 'react';
import { QueryClientContext } from '@tanstack/react-query';
import { Map, NavigationControl } from 'react-map-gl/maplibre';
import { Canvas } from 'react-three-map/maplibre';
import { EditorContext, useEditorDispatch } from '../../context/EditorContext';
import { ObjectsLayer } from '../ObjectsLayer';
import { SelectionRaycaster } from '../ObjectsLayer/SelectionRaycaster';

import 'maplibre-gl/dist/maplibre-gl.css';

import s from './styles.module.css';

type MapCanvasProps = {
    bounds: PatioBounds;
};

const DEFAULT_PITCH = 45;
const DEFAULT_BEARING = 0;
const DEFAULT_ZOOM = 15;

export const MapCanvas: React.FC<MapCanvasProps> = ({ bounds }) => {
    const [west, south, east, north] = bounds;
    const dispatch = useEditorDispatch();
    const editorCtx = useContext(EditorContext);
    const queryClient = useContext(QueryClientContext);

    const center = useMemo(() => {
        return { lng: (west + east) / 2, lat: (south + north) / 2 };
    }, [west, east, south, north]);

    const handleMove = useCallback(
        (event: ViewStateChangeEvent) => {
            dispatch({
                type: 'setMapCenter',
                center: { lng: event.viewState.longitude, lat: event.viewState.latitude },
            });
        },
        [dispatch]
    );

    return (
        <div className={s.wrap}>
            <Map
                mapStyle={{
                    version: 8,
                    sources: {
                        osm: {
                            type: 'raster',
                            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                            tileSize: 256,
                            attribution: '© OpenStreetMap',
                        },
                    },
                    layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
                }}
                initialViewState={{
                    longitude: center.lng,
                    latitude: center.lat,
                    zoom: DEFAULT_ZOOM,
                    pitch: DEFAULT_PITCH,
                    bearing: DEFAULT_BEARING,
                }}
                maxBounds={[west, south, east, north]}
                attributionControl={false}
                canvasContextAttributes={{ antialias: true }}
                style={{ width: '100%', height: '100%' }}
                onMove={handleMove}
            >
                <NavigationControl position="top-right" visualizePitch />
                <Canvas latitude={center.lat} longitude={center.lng}>
                    <EditorContext value={editorCtx}>
                        <QueryClientContext value={queryClient}>
                            <ambientLight intensity={0.8} />
                            <directionalLight position={[10, 20, 10]} intensity={1} />
                            <ObjectsLayer anchor={center} />
                            <SelectionRaycaster />
                        </QueryClientContext>
                    </EditorContext>
                </Canvas>
            </Map>
        </div>
    );
};
