import type { Model3D } from '@/services/models/types';
import { useCallback, useState } from 'react';
import ChevronRightIcon from '@/icons/chevrone-right_24.svg?react';
import Cube24Icon from '@/icons/cube_24.svg?react';
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
import { AssetPreviewPopup } from './components/AssetPreviewPopup';
import s from './styles.module.css';

export type CatalogPanelProps = {
    /** Sidebar container the preview popup anchors against. */
    anchorRef: React.RefObject<HTMLElement | null>;
    /** Whether the Assets tab is the active sidebar tab; closes the popup when false. */
    active: boolean;
};

export const CatalogPanel: React.FC<CatalogPanelProps> = ({ anchorRef, active }) => {
    const { data, isLoading } = useModelsQuery();
    const dispatch = useEditorDispatch();
    const viewer = useCesiumViewer();
    const { state: upload } = useUploadModel();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Drop the preview when the panel stops being the active tab — the popup is
    // portaled, so it would otherwise float on while the sidebar shows the Scene
    // tab. Adjusting state during render (the React-blessed "derive from prop
    // change" pattern) avoids a cascading effect re-render.
    const [wasActive, setWasActive] = useState(active);
    if (wasActive !== active) {
        setWasActive(active);
        if (!active) {
            setSelectedId(null);
        }
    }

    const spawnModel = useCallback(
        (model: Model3D) => {
            if (!viewer) return;
            const { scene } = viewer;
            const { canvas } = scene;
            // Sample the center of the *visible* canvas region: full width minus the
            // catalog panel occluding the left edge, so the object drops where the
            // user is actually looking.
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
        },
        [viewer, dispatch]
    );

    const selectedModel =
        data?.find((model) => {
            return model.id === selectedId;
        }) ?? null;

    const handleSpawn = useCallback(
        (model: Model3D) => {
            spawnModel(model);
            setSelectedId(null);
        },
        [spawnModel]
    );

    // Transient placeholder mirroring the dialog: live progress while uploading,
    // a settled tile once the preview is ready. Driven entirely by the provider.
    const pending = upload.status === 'uploading' || upload.status === 'preview' ? upload : null;

    return (
        <aside className={s.panel}>
            {isLoading ? <p className={s.status}>Loading models…</p> : null}

            {data ? (
                <ul className={s.list}>
                    {pending ? (
                        <li>
                            <div className={clsx(s.item, s.pending)}>
                                <span className={s['thumb-wrap']}>
                                    {pending.status === 'preview' && pending.thumbnailUrl ? (
                                        <img src={pending.thumbnailUrl} alt="" className={s.thumb} />
                                    ) : (
                                        <Cube24Icon className={s['thumb-placeholder']} aria-hidden />
                                    )}
                                </span>
                                {/* <span className={s['label-wrap']}>
                                    <Typography
                                        className={clsx(s.label, 'truncate')}
                                        variant="text-xs"
                                        render={<span />}
                                    >
                                        {pending.file.name}
                                    </Typography>
                                </span> */}
                                {pending.status === 'uploading' ? (
                                    <ProgressBar
                                        className={s['pending-progress']}
                                        value={pending.progress}
                                        aria-label="Upload progress"
                                    />
                                ) : null}
                            </div>
                        </li>
                    ) : null}
                    {data.map((model) => {
                        return (
                            <li key={model.id}>
                                <button
                                    type="button"
                                    className={s.item}
                                    data-selected={model.id === selectedId || undefined}
                                    title={`Preview ${model.name}`}
                                    onClick={() => {
                                        setSelectedId(model.id);
                                    }}
                                >
                                    <span className={s['thumb-wrap']}>
                                        <img src={model.previewUrl} alt="" className={s.thumb} loading="lazy" />
                                    </span>
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
                                    <span className="sr-only">Preview {model.name}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : null}

            <AssetPreviewPopup
                model={selectedModel}
                open={selectedModel !== null}
                anchorRef={anchorRef}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedId(null);
                    }
                }}
                onSpawn={handleSpawn}
            />
        </aside>
    );
};
