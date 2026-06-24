import type { Model3D } from '@/services/models/types';

export type AssetPreviewPopupProps = {
    /** The asset being previewed; `null` keeps the popup closed/empty. */
    model: Model3D | null;
    /** Controlled open state. */
    open: boolean;
    /** Element the popup is positioned against — the sidebar container. */
    anchorRef: React.RefObject<HTMLElement | null>;
    /** Fired on Esc / outside-press / close button. */
    onOpenChange: (_open: boolean) => void;
    /** Adds the model to the scene; the popup closes afterwards. */
    onSpawn: (_model: Model3D) => void;
};
