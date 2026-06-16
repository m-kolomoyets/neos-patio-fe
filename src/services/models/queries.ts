import type { UploadModelThumbnailVariables, UploadModelVariables } from './types';
import { mutationOptions, queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { deleteModel, listModels, uploadModel, uploadModelThumbnail } from './api';
import { modelsKeys } from './queryKeys';

export const getModelsQueryOptions = () => {
    return queryOptions({
        queryKey: modelsKeys.list(),
        queryFn: listModels,
    });
};

export const useModelsQuery = () => {
    return useQuery(getModelsQueryOptions());
};

export const uploadModelMutationOptions = () => {
    return mutationOptions({
        mutationKey: [...modelsKeys.root(), 'upload'],
        mutationFn({ entryPath, files, ...options }: UploadModelVariables) {
            return uploadModel(entryPath, files, options);
        },
    });
};

export const useUploadModelMutation = () => {
    return useMutation(uploadModelMutationOptions());
};

export const deleteModelMutationOptions = () => {
    return mutationOptions({
        mutationKey: [...modelsKeys.root(), 'delete'],
        mutationFn(id: string) {
            return deleteModel(id);
        },
    });
};

export const useDeleteModelMutation = () => {
    return useMutation(deleteModelMutationOptions());
};

export const uploadModelThumbnailMutationOptions = () => {
    return mutationOptions({
        mutationKey: [...modelsKeys.root(), 'upload-thumbnail'],
        mutationFn(variables: UploadModelThumbnailVariables) {
            return uploadModelThumbnail(variables);
        },
    });
};

export const useUploadModelThumbnailMutation = () => {
    return useMutation(uploadModelThumbnailMutationOptions());
};
