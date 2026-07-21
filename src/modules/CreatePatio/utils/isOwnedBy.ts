import { DEV_OWNER_ADDRESS } from '@/services/patios/fixtures';

/**
 * Case-insensitive wallet comparison — the single ownership test behind every
 * "mine" color on the map. An absent owner (never minted) or no connected wallet
 * is never mine.
 *
 * In dev, `DEV_ASSUME_OWNER_ADDRESS` stands in for the connected wallet so the
 * owned indicator colors (orange / yellow) are reachable without connecting.
 */
export const isOwnedBy = (ownerAddress: string | undefined, connectedAddress: string | undefined): boolean => {
    if (!ownerAddress) return false;

    const owner = ownerAddress.toLowerCase();
    if (owner === connectedAddress?.toLowerCase()) return true;

    // Dev demo: the dev-account fixtures read as mine whatever wallet is (or isn't)
    // connected, so all four indicator colors are on screen without swapping accounts.
    return Boolean(DEV_ASSUME_OWNER_ADDRESS && owner === DEV_ASSUME_OWNER_ADDRESS.toLowerCase());
};

/**
 * Dev-only stand-in for the connected wallet, so the fixtures minted by the dev
 * account render as "mine" before any wallet is connected. `undefined` in
 * production — there, ownership is only ever the real connected account.
 * TODO: drop once patios carry a real on-chain owner.
 */
const DEV_ASSUME_OWNER_ADDRESS = import.meta.env.DEV ? DEV_OWNER_ADDRESS : undefined;
