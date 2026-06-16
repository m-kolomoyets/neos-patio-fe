import type { Model3D, UploadModelOptions, UploadModelResult, UploadModelThumbnailVariables } from './types';
import { sleep } from '@/lib/utils/sleep';

const MOCK_DELAY_MS = 200;
const MOCK_UPLOAD_DURATION_MS = 2500;
const MOCK_UPLOAD_TICK_MS = 100;
const SAMPLE_ASSETS_BASE = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models';

const buildAsset = (name: string, dirName?: string): Pick<Model3D, 'gltfUrl' | 'previewUrl'> => {
    const dir = dirName ?? name;
    return {
        gltfUrl: `${SAMPLE_ASSETS_BASE}/${dir}/glTF-Binary/${name}.glb`,
        previewUrl: `${SAMPLE_ASSETS_BASE}/${dir}/screenshot/screenshot.jpg`,
    };
};

const MODELS_FIXTURES: Model3D[] = [{ id: 'lantern', name: 'Lantern', ...buildAsset('Lantern') }];

export const listModels = async (): Promise<Model3D[]> => {
    await sleep(MOCK_DELAY_MS);
    return MODELS_FIXTURES;
};

/**
 * Mock model upload — drives `onProgress` 0→100 over a simulated duration and
 * resolves with the issued model id. Rejects with an `AbortError` if `signal` fires.
 */
export const uploadModel = async (file: File, options: UploadModelOptions = {}): Promise<UploadModelResult> => {
    const { onProgress, signal } = options;
    const ticks = Math.ceil(MOCK_UPLOAD_DURATION_MS / MOCK_UPLOAD_TICK_MS);

    for (let tick = 1; tick <= ticks; tick++) {
        if (signal?.aborted) {
            throw new DOMException('Upload aborted', 'AbortError');
        }
        await sleep(MOCK_UPLOAD_TICK_MS);
        onProgress?.(Math.round((tick / ticks) * 100));
    }

    return { id: `model-${crypto.randomUUID()}-${file.size}` };
};

/** Mock model delete. */
export const deleteModel = async (_id: string): Promise<void> => {
    await sleep(MOCK_DELAY_MS);
};

/** Mock thumbnail upload for an already-created model. */
export const uploadModelThumbnail = async ({ id: _id, blob: _blob }: UploadModelThumbnailVariables): Promise<void> => {
    await sleep(MOCK_DELAY_MS);
};
