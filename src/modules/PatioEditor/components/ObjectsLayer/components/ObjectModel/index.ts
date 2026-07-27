import type { Model as CesiumModel, Scene } from 'cesium';
import type { PlacedObject } from '@/services/patios/types';
import { Color, Model } from 'cesium';
import { geoPoseToModelMatrix } from '../../../../utils/geoPlacement';

/**
 * Property carried on a placed model's pickable `id`. `scene.pick` reads it back
 * to tell editor-placed objects apart from the world tileset (used by selection).
 */
export const EDITOR_OBJECT_ID = 'editorObjectId';

/** Silhouette outline drawn on the selected model (cleared on deselect). */
const SILHOUETTE_COLOR = Color.WHITE;
const SILHOUETTE_SIZE_SELECTED = 2;
const SILHOUETTE_SIZE_NONE = 0;

export type ObjectModelHandle = {
    readonly id: string;
    /**
     * Settles once the async load has finished — resolving `true` when the model
     * loaded and entered the scene, `false` when it failed (or was disposed first).
     * Never rejects, so a batch loader can gate on the whole set without a dead
     * asset stalling completion.
     */
    readonly ready: Promise<boolean>;
    /** Re-apply a (possibly changed) pose to the live model. */
    update: (_object: PlacedObject) => void;
    /** Toggle the selection silhouette outline. */
    setSelected: (_selected: boolean) => void;
    /**
     * The live Cesium {@link CesiumModel} once it has loaded, else `null`. The
     * transform gizmo attaches to it via its `modelMatrix`.
     */
    getModel: () => CesiumModel | null;
    /** Remove and destroy the underlying Cesium primitive. */
    destroy: () => void;
};

/**
 * Owns one native Cesium {@link Model} for a placed object. The model loads
 * asynchronously via `Model.fromGltfAsync`, is tagged with {@link EDITOR_OBJECT_ID}
 * so picking can identify it, and shares the world's depth buffer so it is
 * occluded correctly. Its placement comes entirely from the geographic + HPR
 * pose baked into `modelMatrix`. `onReady` fires once the model is in the scene
 * so the caller can request a render under `requestRenderMode`.
 */
/**
 * `pickable: false` omits the {@link EDITOR_OBJECT_ID} pick id, yielding a purely
 * decorative model (read-only Patio View). Defaults to pickable for the editor.
 */
export type CreateObjectModelOptions = {
    pickable?: boolean;
};

export const createObjectModel = (
    scene: Scene,
    object: PlacedObject,
    gltfUrl: string,
    onReady: () => void,
    options: CreateObjectModelOptions = {}
): ObjectModelHandle => {
    const { pickable = true } = options;
    let model: CesiumModel | null = null;
    let disposed = false;
    // The latest pose, applied as soon as the async model resolves.
    let pending: PlacedObject = object;
    // Latest selection state, applied as soon as the async model resolves.
    let selected = false;

    let resolveReady: (_loaded: boolean) => void;
    const ready = new Promise<boolean>((resolve) => {
        resolveReady = resolve;
    });

    const applySilhouette = () => {
        if (!model) return;
        model.silhouetteColor = SILHOUETTE_COLOR;
        model.silhouetteSize = selected ? SILHOUETTE_SIZE_SELECTED : SILHOUETTE_SIZE_NONE;
    };

    void Model.fromGltfAsync({
        url: gltfUrl,
        modelMatrix: geoPoseToModelMatrix(object),
        id: pickable ? { [EDITOR_OBJECT_ID]: object.id } : undefined,
    })
        .then((loaded) => {
            if (disposed) {
                loaded.destroy();
                resolveReady(false);
                return;
            }
            model = loaded;
            model.modelMatrix = geoPoseToModelMatrix(pending);
            applySilhouette();
            scene.primitives.add(model);
            onReady();
            resolveReady(true);
        })
        .catch((error: unknown) => {
            if (!disposed) {
                // eslint-disable-next-line no-console
                console.error('Failed to load placed object model', error);
            }
            resolveReady(false);
        });

    return {
        id: object.id,
        ready,
        update(next) {
            pending = next;
            if (model) {
                model.modelMatrix = geoPoseToModelMatrix(next);
            }
        },
        setSelected(next) {
            selected = next;
            applySilhouette();
        },
        getModel() {
            return model;
        },
        destroy() {
            disposed = true;
            if (model && !model.isDestroyed()) {
                // `remove` destroys the primitive by default.
                scene.primitives.remove(model);
            }
        },
    };
};
