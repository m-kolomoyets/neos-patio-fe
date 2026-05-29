import { useGLTF } from '@react-three/drei';
import { useModelsQuery } from '@/services/models/queries';
import { useEditorDispatch } from '../../context/EditorContext';
import s from './styles.module.css';

export const CatalogPanel: React.FC = () => {
    const { data, isLoading } = useModelsQuery();
    const dispatch = useEditorDispatch();

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
                                        dispatch({ type: 'add', modelId: model.id });
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
