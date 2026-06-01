import type { ViewStateChangeEvent } from 'react-map-gl/maplibre';
import type { PatioBounds } from '@/services/patios/types';
import { useCallback, useContext, useMemo } from 'react';
import { QueryClientContext } from '@tanstack/react-query';
import { Map, NavigationControl } from 'react-map-gl/maplibre';
import { Canvas } from 'react-three-map/maplibre';
import {
    BUILDINGS_MIN_ZOOM,
    BUILDINGS_SOURCE_LAYER,
    DEFAULT_BEARING,
    DEFAULT_PITCH,
    DEFAULT_ZOOM,
    MAP_CONFIG,
    MAP_LAYER_IDS,
    MAP_SOURCE_IDS,
} from './constants';
import { EditorContext, useEditorDispatch } from '../../context/EditorContext';
import { ObjectsLayer } from '../ObjectsLayer';
import { SelectionRaycaster } from '../ObjectsLayer/SelectionRaycaster';

import 'maplibre-gl/dist/maplibre-gl.css';

import s from './styles.module.css';

type MapCanvasProps = {
    bounds: PatioBounds;
};

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
                        'esri-satellite': {
                            type: 'raster',
                            tiles: [
                                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                            ],
                            tileSize: 256,
                            maxzoom: 19,
                            attribution: 'Imagery © Esri',
                        },
                        'esri-transport': {
                            type: 'raster',
                            tiles: [
                                'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
                            ],
                            tileSize: 256,
                            maxzoom: 19,
                        },
                        'esri-labels': {
                            type: 'raster',
                            tiles: [
                                'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                            ],
                            tileSize: 256,
                            maxzoom: 19,
                        },
                        [MAP_SOURCE_IDS.vector]: {
                            type: 'vector',
                            url: MAP_CONFIG.vectorTilesUrl,
                        },
                        [MAP_SOURCE_IDS.terrainDem]: {
                            type: 'raster-dem',
                            url: MAP_CONFIG.terrainDemUrl,
                            encoding: 'mapbox',
                        },
                    },
                    layers: [
                        { id: 'esri-satellite', type: 'raster', source: 'esri-satellite' },
                        { id: 'esri-transport', type: 'raster', source: 'esri-transport' },
                        { id: 'esri-labels', type: 'raster', source: 'esri-labels' },
                        {
                            id: MAP_LAYER_IDS.buildings,
                            type: 'fill-extrusion',
                            source: MAP_SOURCE_IDS.vector,
                            'source-layer': BUILDINGS_SOURCE_LAYER,
                            minzoom: BUILDINGS_MIN_ZOOM,
                            paint: {
                                'fill-extrusion-color': '#aaa',
                                'fill-extrusion-height': ['get', 'render_height'],
                                'fill-extrusion-base': ['get', 'render_min_height'],
                                'fill-extrusion-opacity': 0.85,
                            },
                        },
                    ],
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
