import { useGLTF } from '@react-three/drei';
import { useMap } from 'react-map-gl/maplibre';
import { useModelsQuery } from '@/services/models/queries';
import { EDITOR_MAP_ID } from '../../constants';
import { useEditorDispatch } from '../../context/EditorContext';
import s from './styles.module.css';

export const CatalogPanel: React.FC = () => {
    const { data, isLoading } = useModelsQuery();
    const dispatch = useEditorDispatch();
    const maps = useMap();

    return (
        <aside className={s.panel}>
            <h3 className={s.title}>Catalog</h3>
            {isLoading ? <p className={s.status}>Loading models…</p> : null}
            {data ? (
                <ul className={s.list}>
                    {data.map((model) => {
                        return (
                            <li key={model.id}>
                                <button
                                    type="button"
                                    className={s.item}
                                    onMouseEnter={() => {
                                        useGLTF.preload(model.gltfUrl);
                                    }}
                                    onFocus={() => {
                                        useGLTF.preload(model.gltfUrl);
                                    }}
                                    onClick={() => {
                                        const map = maps[EDITOR_MAP_ID];
                                        if (!map) return;
                                        const { lng, lat } = map.getCenter();
                                        dispatch({ type: 'add', modelId: model.id, center: { lng, lat } });
                                    }}
                                >
                                    <img src={model.previewUrl} alt="" className={s.thumb} loading="lazy" />
                                    <span className={s.label}>{model.name}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : null}
        </aside>
    );
};
