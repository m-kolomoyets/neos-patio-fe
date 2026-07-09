import type { Model3D } from '@/services/models/types';
import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUploadModelThumbnailMutation } from '@/services/models/queries';
import { modelsKeys } from '@/services/models/queryKeys';
import { toast } from '@/components/ui/Toast';

const THUMBNAIL_ERROR_MESSAGE = 'Could not save the thumbnail.';

/**
 * Applies a freshly-captured snapshot as a model's thumbnail: swaps the models-list
 * cache to a local object URL so the sidebar tile updates instantly, then persists
 * the blob in the background. A persistence failure only toasts — the optimistic
 * thumbnail stays. Each model keeps its own minted URL, revoked only when that same
 * model is re-captured, so capturing asset B never breaks asset A's tile.
 */
export const useThumbnailCapture = () => {
    const queryClient = useQueryClient();
    const uploadThumbnailMutation = useUploadModelThumbnailMutation();
    const urlsRef = useRef<Map<string, string>>(new Map());

    // Revoke every minted URL when the popup unmounts.
    useEffect(() => {
        const urls = urlsRef.current;
        return () => {
            urls.forEach((url) => {
                URL.revokeObjectURL(url);
            });
            urls.clear();
        };
    }, []);

    return useCallback(
        (modelId: string, blob: Blob) => {
            const prevUrl = urlsRef.current.get(modelId);
            if (prevUrl) {
                URL.revokeObjectURL(prevUrl);
            }
            const url = URL.createObjectURL(blob);
            urlsRef.current.set(modelId, url);

            // Optimistic swap — the sidebar thumb changes without waiting on the upload.
            queryClient.setQueryData<Model3D[]>(modelsKeys.list(), (prev) => {
                return prev?.map((model) => {
                    return model.id === modelId ? { ...model, previewUrl: url } : model;
                });
            });

            // Background persistence; non-blocking, a failure only toasts.
            uploadThumbnailMutation.mutateAsync({ id: modelId, blob }).catch(() => {
                toast.error(THUMBNAIL_ERROR_MESSAGE);
            });
        },
        [queryClient, uploadThumbnailMutation]
    );
};
