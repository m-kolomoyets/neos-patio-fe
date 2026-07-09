import type { Model3D } from '@/services/models/types';

export type DeleteAssetDialogProps = {
    /** Asset targeted for deletion; the dialog renders nothing when null. */
    model: Model3D | null;
    open: boolean;
    onOpenChange: (_open: boolean) => void;
};
