import { useAccount } from 'wagmi';
import { isOwnedBy } from '../utils/isOwnedBy';

/**
 * Whether the connected wallet minted the patio with this owner address. The one
 * place a component asks "is this mine?" — the clustering collection derives the
 * same answer in bulk through `isOwnedBy`, so a popup can never disagree with the
 * square it was opened from.
 */
export const useIsMine = (ownerAddress: string | undefined): boolean => {
    const { address } = useAccount();

    return isOwnedBy(ownerAddress, address);
};
