import type { Scene } from 'cesium';
import type { ObjectModelHandle } from '@/modules/PatioEditor/components/ObjectsLayer/components/ObjectModel';
import type { ObjectLoad } from './planObjectLoads';
import { createObjectModel } from '@/modules/PatioEditor/components/ObjectsLayer/components/ObjectModel';

/** Outcome of a settled batch: how many models loaded vs failed. */
export type ObjectBatchResult = {
    loaded: number;
    failed: number;
};

/** A running batch: its live handles plus a teardown, and a settle signal. */
export type ObjectBatch = {
    handles: ObjectModelHandle[];
    /** Settles once every model has loaded or failed. Never rejects. */
    done: Promise<ObjectBatchResult>;
    /** Destroy every primitive the batch created. */
    destroy: () => void;
};

/**
 * Drives a patio's placed models into the scene as one concurrent batch. Each
 * object gets its own {@link createObjectModel} primitive (fired without waiting on
 * the others), so all `Model.fromGltfAsync` fetches run in parallel and Cesium's
 * `ResourceCache` dedupes any repeated URL automatically. A single scene render is
 * requested once the whole batch settles — not one per model — and the batch
 * settles on failure as well as success, so a dead asset URL cannot stall it.
 */
export const loadObjectBatch = (scene: Scene, loads: ObjectLoad[], requestRender: () => void): ObjectBatch => {
    // Non-interactive, decorative models: no pick id, no silhouette. Per-model
    // render is suppressed (noop onReady) in favor of one render on settle.
    const noop = () => {};
    const handles = loads.map((load) => {
        return createObjectModel(scene, load.object, load.gltfUrl, noop, { pickable: false });
    });

    const done = Promise.all(
        handles.map((handle) => {
            return handle.ready;
        })
    ).then((outcomes) => {
        const loaded = outcomes.filter(Boolean).length;
        requestRender();
        return { loaded, failed: outcomes.length - loaded };
    });

    return {
        handles,
        done,
        destroy() {
            for (const handle of handles) {
                handle.destroy();
            }
        },
    };
};
