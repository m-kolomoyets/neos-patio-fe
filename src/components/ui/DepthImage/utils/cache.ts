import type { GDepthAssets } from './parseGDepth';
import { parseGDepth } from './parseGDepth';

const cache = new Map<string, Promise<GDepthAssets>>();

export const getDepthAssets = (src: string): Promise<GDepthAssets> => {
    let entry = cache.get(src);
    if (!entry) {
        entry = parseGDepth(src).catch((err) => {
            cache.delete(src);
            throw err;
        });
        cache.set(src, entry);
    }
    return entry;
};
