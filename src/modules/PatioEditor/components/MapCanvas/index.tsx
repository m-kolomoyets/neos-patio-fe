import type { PatioBounds } from '@/services/patios/types';
import { useContext, useMemo } from 'react';
import { QueryClientContext } from '@tanstack/react-query';
import { Map } from 'react-map-gl/maplibre';
import { Canvas } from 'react-three-map/maplibre';
import { EDITOR_MAP_ID } from '../../constants';
import { DEFAULT_BEARING, DEFAULT_PITCH, DEFAULT_ZOOM, MAP_STYLE } from './constants';
import { EditorContext } from '../../context/EditorContext';
import { SelectionOutline } from '../ObjectsLayer/components/SelectionOutline';
import { SelectionRaycaster } from '../ObjectsLayer/components/SelectionRaycaster';
import { ObjectsLayer } from '../ObjectsLayer';

import 'maplibre-gl/dist/maplibre-gl.css';

import s from './styles.module.css';

type MapCanvasProps = {
    bounds: PatioBounds;
};

export const MapCanvas: React.FC<MapCanvasProps> = ({ bounds }) => {
    const [west, south, east, north] = bounds;
    const editorCtx = useContext(EditorContext);
    const queryClient = useContext(QueryClientContext);

    const center = useMemo(() => {
        return { lng: (west + east) / 2, lat: (south + north) / 2 };
    }, [west, east, south, north]);

    const maxBounds = useMemo<[number, number, number, number]>(() => {
        return [west, south, east, north];
    }, [west, south, east, north]);

    return (
        <div className={s.wrap}>
            <Map
                mapStyle={MAP_STYLE}
                id={EDITOR_MAP_ID}
                initialViewState={{
                    longitude: center.lng,
                    latitude: center.lat,
                    zoom: DEFAULT_ZOOM,
                    pitch: DEFAULT_PITCH,
                    bearing: DEFAULT_BEARING,
                }}
                maxPitch={85}
                maxBounds={maxBounds}
                attributionControl={false}
                canvasContextAttributes={{ antialias: true }}
                style={{ width: '100%', height: '100%' }}
            >
                <Canvas frameloop="demand" latitude={center.lat} longitude={center.lng}>
                    <EditorContext value={editorCtx}>
                        <QueryClientContext value={queryClient}>
                            <ambientLight intensity={0.8} />
                            <directionalLight position={[10, 20, 10]} intensity={1} />
                            <ObjectsLayer />
                            <SelectionRaycaster />
                            <SelectionOutline />
                        </QueryClientContext>
                    </EditorContext>
                </Canvas>
            </Map>
        </div>
    );
};
