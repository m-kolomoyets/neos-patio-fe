import ChevronRightIcon from '@/icons/chevrone-right_24.svg?react';
import { Cartesian2 } from 'cesium';
import clsx from 'clsx';
import { useModelsQuery } from '@/services/models/queries';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Typography } from '@/components/ui/Typography';
import { CATALOG_PANEL_INSET_PX } from './constants';
import { pickGroundPoint } from '../../utils/geoPlacement';
import { useCesiumViewer } from '../../context/CesiumViewerContext';
import { useEditorDispatch } from '../../context/EditorContext';
import { useUploadModel } from '../../context/UploadModelContext';
import s from './styles.module.css';

export const CatalogPanel: React.FC = () => {
    const { data, isLoading } = useModelsQuery();
    const dispatch = useEditorDispatch();
    const viewer = useCesiumViewer();
    const { state: upload } = useUploadModel();

    // Transient placeholder mirroring the dialog: live progress while uploading,
    // a settled tile once the preview is ready. Driven entirely by the provider.
    const pending = upload.status === 'uploading' || upload.status === 'preview' ? upload : null;

    return (
        <aside className={s.panel}>
            {isLoading ? <p className={s.status}>Loading models…</p> : null}
            {pending ? (
                <ul className={s.list}>
                    <li className={s.pending}>
                        {pending.status === 'preview' && pending.thumbnailUrl ? (
                            <img src={pending.thumbnailUrl} alt="" className={s.thumb} />
                        ) : (
                            <span className={s.thumb} aria-hidden />
                        )}
                        <span className={s['label-wrap']}>
                            <Typography className={clsx(s.label, 'truncate')} variant="text-xs" render={<span />}>
                                {pending.file.name}
                            </Typography>
                        </span>
                        {pending.status === 'uploading' ? (
                            <ProgressBar
                                className={s['pending-progress']}
                                value={pending.progress}
                                aria-label="Upload progress"
                            />
                        ) : null}
                    </li>
                </ul>
            ) : null}
            {data ? (
                <ul className={s.list}>
                    {data.map((model) => {
                        return (
                            <li key={model.id}>
                                <button
                                    type="button"
                                    className={s.item}
                                    title={`Add ${model.name} to the scene`}
                                    onClick={() => {
                                        if (!viewer) return;
                                        const { scene } = viewer;
                                        const { canvas } = scene;
                                        // Sample the center of the *visible* canvas region: full
                                        // width minus the catalog panel occluding the left edge,
                                        // so the object drops where the user is actually looking.
                                        const x = (CATALOG_PANEL_INSET_PX + canvas.clientWidth) / 2;
                                        const y = canvas.clientHeight / 2;
                                        const point = pickGroundPoint(scene, new Cartesian2(x, y));
                                        if (!point) return;
                                        dispatch({
                                            type: 'add',
                                            modelId: model.id,
                                            modelName: model.name,
                                            position: point,
                                        });
                                    }}
                                >
                                    <img src={model.previewUrl} alt="" className={s.thumb} loading="lazy" />
                                    <span className={s['label-wrap']}>
                                        <Typography
                                            className={clsx(s.label, 'truncate')}
                                            variant="text-xs"
                                            render={<span />}
                                        >
                                            {model.name}
                                        </Typography>
                                        <ChevronRightIcon className={s.icon} />
                                    </span>
                                    <span className="sr-only">Add {model.name} to the scene</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : null}
        </aside>
    );
};
