import { useGLTF } from '@react-three/drei';
import { useMap } from 'react-map-gl/maplibre';
import { useModelsQuery } from '@/services/models/queries';
import { EDITOR_MAP_ID } from '../../constants';
import { CATALOG_PANEL_INSET_PX } from './constants';
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
                                        // Sample the center of the *visible* map region: full canvas
                                        // width minus the catalog panel that occludes the left edge,
                                        // so the object spawns where the user is actually looking.
                                        const { clientWidth, clientHeight } = map.getContainer();
                                        const x = (CATALOG_PANEL_INSET_PX + clientWidth) / 2;
                                        const { lng, lat } = map.unproject([x, clientHeight / 2]);
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
