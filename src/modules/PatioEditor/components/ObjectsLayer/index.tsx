import { useModelsQuery } from '@/services/models/queries';
import { type LngLatAlt } from '../../utils/geoSceneProjection';
import { useEditorState } from '../../context/EditorContext';
import { ObjectMesh } from './ObjectMesh';

type ObjectsLayerProps = {
    anchor: LngLatAlt;
};

export const ObjectsLayer: React.FC<ObjectsLayerProps> = ({ anchor }) => {
    const { objects } = useEditorState();
    const { data: models } = useModelsQuery();

    if (!models) return null;

    const modelById = new Map(
        models.map((m) => {
            return [m.id, m];
        })
    );

    return (
        <>
            {objects.map((obj) => {
                const model = modelById.get(obj.modelId);
                if (!model) return null;
                return <ObjectMesh key={obj.id} object={obj} anchor={anchor} gltfUrl={model.gltfUrl} />;
            })}
        </>
    );
};
