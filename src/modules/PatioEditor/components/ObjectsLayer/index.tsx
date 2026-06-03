import { useMemo } from 'react';
import { useModelsQuery } from '@/services/models/queries';
import { useEditorState } from '../../context/EditorContext';
import { ObjectMesh } from './components/ObjectMesh';

export const ObjectsLayer: React.FC = () => {
    const { objects } = useEditorState();
    const { data: models } = useModelsQuery();

    const modelById = useMemo(() => {
        return new Map(
            (models ?? []).map((m) => {
                return [m.id, m];
            })
        );
    }, [models]);

    if (!models) return null;

    return (
        <>
            {objects.map((obj) => {
                const model = modelById.get(obj.modelId);
                if (!model) return null;
                return <ObjectMesh key={obj.id} object={obj} gltfUrl={model.gltfUrl} />;
            })}
        </>
    );
};
