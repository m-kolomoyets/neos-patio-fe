import type { PatioPointCollection } from '@/services/patios/types';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { usePatioPoints } from '@/services/patios/queries';
import { isOwnedBy } from '../utils/isOwnedBy';

const EMPTY_COLLECTION: PatioPointCollection = { type: 'FeatureCollection', features: [] };

/**
 * The clustering point collection with `isMine` resolved against the connected
 * wallet. The service layer knows nothing about wallets, so ownership is derived
 * here — and because the memo keys on the account address, connecting,
 * disconnecting, or switching account produces a new collection identity and the
 * `<Source>` data (and every square color) updates with no reload.
 */
export const usePatioPointsWithOwnership = (): PatioPointCollection => {
    const { data } = usePatioPoints();
    const { address } = useAccount();

    return useMemo(() => {
        if (!data) return EMPTY_COLLECTION;

        return {
            ...data,
            features: data.features.map((feature) => {
                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        isMine: isOwnedBy(feature.properties.ownerAddress, address),
                    },
                };
            }),
        };
    }, [data, address]);
};
