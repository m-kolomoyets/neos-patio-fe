import { useSuspenseQuery } from '@tanstack/react-query';
import { getPatioQueryOptions } from '@/services/patios/queries';
import { Typography } from '@/components/ui/Typography';
import { CesiumViewerProvider } from './context/CesiumViewerContext';
import { EditorProvider } from './context/EditorContext';
import { UploadModelProvider } from './context/UploadModelContext';
import { useAutosavePatio } from './hooks/useAutosavePatio';
import { useDeleteSelectedShortcut } from './hooks/useDeleteSelectedShortcut';
import { useIdleRotation } from './hooks/useIdleRotation';
import { usePatioEditorParams } from './hooks/usePatioEditorRouteApi';
import { MapCanvas } from './components/MapCanvas';
import { ObjectsLayer } from './components/ObjectsLayer';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { ViewCube } from './components/ViewCube';
import s from './styles.module.css';

type EditorShellProps = {
    patioId: string;
    bounds: [number, number, number, number];
};

/** Drives the ambient idle-orbit; renders nothing. Must live inside CesiumViewerProvider. */
const IdleOrbit: React.FC = () => {
    useIdleRotation();
    return null;
};

const EditorShell: React.FC<EditorShellProps> = ({ patioId, bounds }) => {
    const { status } = useAutosavePatio(patioId);

    useDeleteSelectedShortcut();

    return (
        <CesiumViewerProvider>
            <MapCanvas bounds={bounds} />
            <ObjectsLayer />
            <UploadModelProvider>
                <Sidebar />
            </UploadModelProvider>
            <Toolbar saveStatus={status} />
            <PropertiesPanel />
            <ViewCube />
            <IdleOrbit />
        </CesiumViewerProvider>
    );
};

const PatioEditor: React.FC = () => {
    const { id } = usePatioEditorParams();
    const { data: patio } = useSuspenseQuery(getPatioQueryOptions(id));

    if (!patio) {
        return (
            <main className={s.wrap}>
                <Typography variant="display-md">Patio not found</Typography>
            </main>
        );
    }

    return (
        <main className={s.wrap}>
            <section className={s.surface}>
                <EditorProvider initialObjects={patio.objects} bounds={patio.bounds}>
                    <EditorShell patioId={patio.id} bounds={patio.bounds} />
                </EditorProvider>
            </section>
        </main>
    );
};

export default PatioEditor;
