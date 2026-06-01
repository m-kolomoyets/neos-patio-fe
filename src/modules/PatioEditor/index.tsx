import { useMemo } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { MapProvider } from 'react-map-gl/maplibre';
import { getPatioQueryOptions } from '@/services/patios/queries';
import { Typography } from '@/components/ui/Typography';
import { EditorProvider } from './context/EditorContext';
import { useAutosavePatio } from './hooks/useAutosavePatio';
import { usePatioEditorParams } from './hooks/usePatioEditorRouteApi';
import { CatalogPanel } from './components/CatalogPanel';
import { MapCanvas } from './components/MapCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Toolbar } from './components/Toolbar';
import { ViewCube } from './components/ViewCube';
import s from './styles.module.css';

type EditorShellProps = {
    patioId: string;
    bounds: [number, number, number, number];
};

const EditorShell: React.FC<EditorShellProps> = ({ patioId, bounds }) => {
    const { status } = useAutosavePatio(patioId);

    return (
        <MapProvider>
            <MapCanvas bounds={bounds} />
            <CatalogPanel />
            <Toolbar saveStatus={status} />
            <PropertiesPanel />
            <ViewCube />
        </MapProvider>
    );
};

const PatioEditor: React.FC = () => {
    const { id } = usePatioEditorParams();
    const { data: patio } = useSuspenseQuery(getPatioQueryOptions(id));

    const initialMapCenter = useMemo(() => {
        if (!patio) return null;
        const [west, south, east, north] = patio.bounds;
        return { lng: (west + east) / 2, lat: (south + north) / 2 };
    }, [patio]);

    if (!patio || !initialMapCenter) {
        return (
            <main className={s.wrap}>
                <Typography variant="display-md">Patio not found</Typography>
            </main>
        );
    }

    return (
        <main className={s.wrap}>
            <section className={s.surface}>
                <EditorProvider
                    initialObjects={patio.objects}
                    initialMapCenter={initialMapCenter}
                    bounds={patio.bounds}
                >
                    <EditorShell patioId={patio.id} bounds={patio.bounds} />
                </EditorProvider>
            </section>
        </main>
    );
};

export default PatioEditor;
