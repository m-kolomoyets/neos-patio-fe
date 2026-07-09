import type { ModelBundle } from './modelBundle';
import { LoadingManager } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACO_DECODER_PATH } from '../constants';
import { normalizeBundlePath } from './normalizeBundlePath';

// DRACOLoader + its decoder are only needed for Draco-compressed models — pulled in
// lazily and shared across uploads so the decoder isn't in the main chunk.
let dracoLoaderPromise: Promise<import('three/examples/jsm/loaders/DRACOLoader.js').DRACOLoader> | null = null;

const getDracoLoader = () => {
    if (!dracoLoaderPromise) {
        dracoLoaderPromise = import('three/examples/jsm/loaders/DRACOLoader.js').then(({ DRACOLoader }) => {
            const loader = new DRACOLoader();
            loader.setDecoderPath(DRACO_DECODER_PATH);
            return loader;
        });
    }
    return dracoLoaderPromise;
};

/**
 * A `GLTFLoader` wired for in-memory bundles. The entry is loaded by its relative
 * path (`bundle.entry.path`); the manager's URL modifier rewrites every resource the
 * loader requests — the entry itself and each `.bin`/texture it resolves — to the
 * matching blob URL. Unreferenced files are simply never requested, so mapping all
 * of them is harmless. A `DRACOLoader` is attached for `KHR_draco_mesh_compression`.
 */
export const createBundleLoader = async (bundle: ModelBundle): Promise<GLTFLoader> => {
    const manager = new LoadingManager();
    manager.setURLModifier((url) => {
        const normalized = normalizeBundlePath(url);
        if (normalized !== null) {
            const blobUrl = bundle.blobUrls.get(normalized);
            if (blobUrl) {
                return blobUrl;
            }
        }
        // Leave anything we don't own untouched (e.g. embedded `data:` URIs).
        return url;
    });

    const loader = new GLTFLoader(manager);
    loader.setDRACOLoader(await getDracoLoader());
    return loader;
};
