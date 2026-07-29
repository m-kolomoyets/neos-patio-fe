import type { Model3D } from '@/services/models/types';
import type { PatioBounds, PlacedObject } from '@/services/patios/types';

/** A placed object paired with the resolved glTF URL of its catalog model. */
export type ObjectLoad = {
    object: PlacedObject;
    gltfUrl: string;
    /**
     * `true` when the object's lng/lat falls outside the patio `bounds`. The view
     * still renders it as authored (no clamp, no drop) — this only flags likely
     * mis-authored fixture data for a development warning. On-edge counts as inside.
     */
    outOfBounds: boolean;
};

/**
 * The resolved load plan for a patio's objects: one {@link ObjectLoad} per placed
 * object (each needs its own primitive/pose) plus the deduped set of glTF URLs the
 * batch actually fetches. `urls` collapses repeated or multi-model references to a
 * unique asset once, mirroring how Cesium's `ResourceCache` dedupes same-URL fetches.
 */
export type ObjectLoadPlan = {
    loads: ObjectLoad[];
    urls: string[];
};

/** `true` when lng/lat lies outside `[west, south, east, north]`. On-edge is inside. */
const isOutOfBounds = (lng: number, lat: number, [west, south, east, north]: PatioBounds): boolean => {
    return lng < west || lng > east || lat < south || lat > north;
};

/**
 * Resolves each placed object's `modelId` to its catalog glTF URL, dropping any
 * object whose model is missing from the catalog, and dedupes the resolved URLs.
 * Flags any object whose lng/lat falls outside `bounds` (still planned — the view
 * never clamps or drops) for a development warning. Pure — no Cesium, no I/O — so
 * the plan is verifiable without a running scene.
 */
export const planObjectLoads = (objects: PlacedObject[], models: Model3D[], bounds: PatioBounds): ObjectLoadPlan => {
    const gltfByModelId = new Map(
        models.map((model) => {
            return [model.id, model.gltfUrl];
        })
    );

    const loads: ObjectLoad[] = [];
    const urls = new Set<string>();
    for (const object of objects) {
        const gltfUrl = gltfByModelId.get(object.modelId);
        if (gltfUrl) {
            loads.push({ object, gltfUrl, outOfBounds: isOutOfBounds(object.lng, object.lat, bounds) });
            urls.add(gltfUrl);
        }
    }
    return { loads, urls: [...urls] };
};
