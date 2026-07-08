import type { Model3D } from '@/services/models/types';
import type { DeleteAssetDialogProps } from './types';
import Close24Icon from '@/icons/close_24.svg?react';
import TrashIcon from '@/icons/trash_24.svg?react';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteModelMutation } from '@/services/models/queries';
import { modelsKeys } from '@/services/models/queryKeys';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { toast } from '@/components/ui/Toast';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

const DELETE_ERROR_MESSAGE = 'Could not delete the asset.';

/**
 * Destructive confirmation for removing a catalog asset. Owns the delete mutation
 * and the optimistic catalog-list cache write, so callers only pass which asset
 * and whether the dialog is open. On success the model leaves the list cache —
 * which drops the popup's selection and closes it — and the dialog resets itself.
 */
export const DeleteAssetDialog: React.FC<DeleteAssetDialogProps> = ({ model, open, onOpenChange }) => {
    const queryClient = useQueryClient();
    const deleteMutation = useDeleteModelMutation();

    if (!model) {
        return null;
    }

    const { id, name, previewUrl } = model;
    const isDeleting = deleteMutation.isPending;

    const handleConfirm = () => {
        deleteMutation.mutate(id, {
            onSuccess() {
                // Optimistic removal — the sidebar tile disappears without a refetch,
                // mirroring the thumbnail-capture cache-write precedent.
                queryClient.setQueryData<Model3D[]>(modelsKeys.list(), (prev) => {
                    return prev?.filter((entry) => {
                        return entry.id !== id;
                    });
                });
                onOpenChange(false);
            },
            onError() {
                toast.error(DELETE_ERROR_MESSAGE);
            },
        });
    };

    return (
        <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
            <AlertDialog.Portal>
                <AlertDialog.Backdrop className={s.backdrop} />
                <AlertDialog.Popup className={s.popup} variant="surface">
                    <div className={s.preview}>
                        <img src={previewUrl} alt="" className={s.thumb} />
                        <AlertDialog.Close
                            render={
                                <Button
                                    className={s.close}
                                    type="button"
                                    variant="surface"
                                    size="md"
                                    isIcon
                                    title="Close"
                                    disabled={isDeleting}
                                >
                                    <Close24Icon />
                                    <span className="sr-only">Close</span>
                                </Button>
                            }
                        />
                    </div>
                    <Separator />
                    <div className={s.body}>
                        <TrashIcon className={s.icon} />
                        <Typography variant="text-md" className={s.title} render={<AlertDialog.Title />}>
                            Are you sure you want to delete this {name} asset?
                        </Typography>
                        <footer className={s.footer}>
                            <Button
                                className={s.cta}
                                variant="surface"
                                size="sm"
                                disabled={isDeleting}
                                render={<AlertDialog.Close />}
                            >
                                No, Cancel
                            </Button>
                            <Button
                                className={s.cta}
                                variant="brand"
                                size="sm"
                                isLoading={isDeleting}
                                onClick={handleConfirm}
                            >
                                Yes, I&apos;m sure
                            </Button>
                        </footer>
                    </div>
                </AlertDialog.Popup>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
};
