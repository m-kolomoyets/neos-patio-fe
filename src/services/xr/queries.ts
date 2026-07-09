import { queryOptions } from '@tanstack/react-query';
import { generateXRLoginCode } from './api';
import { xrKeys } from './queryKeys';

export const getXRLoginCodeQueryOptions = () => {
    return queryOptions({
        queryKey: xrKeys.loginCode(),
        queryFn: generateXRLoginCode,
        staleTime: 0,
        gcTime: 0,
    });
};
