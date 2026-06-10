import { queryOptions, useQuery } from '@tanstack/react-query';
import { listModels } from './api';
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
