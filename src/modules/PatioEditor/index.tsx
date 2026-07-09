import { useEffect } from 'react';
import { CesiumViewerProvider } from '@/contexts/CesiumViewerContext';
import { usePageTransition } from '@/contexts/PageTransitionContext';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useIdleRotation } from '@/hooks/useIdleRotation';
import { getPatioQueryOptions } from '@/services/patios/queries';
import { CesiumMap } from '@/components/CesiumMap';
import { Typography } from '@/components/ui/Typography';
import { ViewCube } from '@/components/ViewCube';
import { EditorProvider } from './context/EditorContext';
import { UploadModelProvider } from './context/UploadModelContext';
import { useAutosavePatio } from './hooks/useAutosavePatio';
import { useDeleteSelectedShortcut } from './hooks/useDeleteSelectedShortcut';
import { usePatioEditorParams } from './hooks/usePatioEditorRouteApi';
import { ObjectsLayer } from './components/ObjectsLayer';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import s from './styles.module.css';

type EditorShellProps = {
    patioId: string;
    bounds: [number, number, number, number];
};

/** Drives the ambient idle-orbit; renders nothing. Must live inside CesiumViewerProvider. */
const IdleOrbit: React.FC<{ bounds: EditorShellProps['bounds'] }> = ({ bounds }) => {
    useIdleRotation(bounds);
    return null;
};

const EditorShell: React.FC<EditorShellProps> = ({ patioId, bounds }) => {
    const { status } = useAutosavePatio(patioId);

    useDeleteSelectedShortcut();

    return (
        <CesiumViewerProvider>
            <CesiumMap className={s.map} bounds={bounds} interaction="edit" />
            <ObjectsLayer />
            <UploadModelProvider>
                <Sidebar />
            </UploadModelProvider>
            <Toolbar saveStatus={status} />
            <PropertiesPanel />
            <ViewCube bounds={bounds} storageId={patioId} />
            <IdleOrbit bounds={bounds} />
        </CesiumViewerProvider>
    );
};

const PatioEditor: React.FC = () => {
    const { id } = usePatioEditorParams();
    const { data: patio } = useSuspenseQuery(getPatioQueryOptions(id));
    const { update } = usePageTransition();

    // Fill the loading overlay with the real background + name once the patio
    // resolves. On the Home path these already match the seeded values; on a
    // deep-link they replace the bare dark fallback.
    useEffect(() => {
        if (patio) {
            update({
                backgroundUrl: patio.previewBackgroundUrl,
                backgroundLowUrl: patio.previewBackgroundLowUrl,
                name: patio.name,
            });
        }
    }, [patio, update]);

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
